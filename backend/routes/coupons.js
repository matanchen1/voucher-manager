const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery } = require('../config/database');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};

// GET /api/coupons - Get all coupons with filtering
router.get('/', [
    query('company').optional().isString().trim(),
    query('category').optional().isString().trim(),
    query('type').optional().isIn(['money', 'product']),
    query('status').optional().isIn(['active', 'used', 'expired', 'expiring']),
    query('search').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
    try {
        const { company, category, type, status, search, limit = 50, offset = 0 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Build dynamic WHERE clause
        if (company) {
            whereClause += ` AND LOWER(company) = LOWER($${paramIndex})`;
            params.push(company);
            paramIndex++;
        }

        if (category) {
            whereClause += ` AND LOWER(category) = LOWER($${paramIndex})`;
            params.push(category);
            paramIndex++;
        }

        if (type) {
            whereClause += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND (LOWER(code) LIKE LOWER($${paramIndex}) OR LOWER(company) LIKE LOWER($${paramIndex}) OR LOWER(notes) LIKE LOWER($${paramIndex}))`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Handle status filtering
        if (status === 'active') {
            whereClause += ` AND ((type = 'product' AND is_used = false) OR (type = 'money' AND remaining_amount > 0)) AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)`;
        } else if (status === 'used') {
            whereClause += ` AND ((type = 'product' AND is_used = true) OR (type = 'money' AND remaining_amount <= 0))`;
        } else if (status === 'expired') {
            whereClause += ` AND expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE`;
        } else if (status === 'expiring') {
            whereClause += ` AND expiration_date IS NOT NULL AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
        }

        const countQuery = `SELECT COUNT(*) FROM coupons ${whereClause}`;
        const dataQuery = `
            SELECT 
                c.*,
                CASE 
                    WHEN c.expiration_date IS NOT NULL AND c.expiration_date <= CURRENT_DATE THEN 'expired'
                    WHEN c.expiration_date IS NOT NULL AND c.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'expiring'
                    WHEN c.type = 'product' AND c.is_used = true THEN 'used'
                    WHEN c.type = 'money' AND c.remaining_amount <= 0 THEN 'used'
                    ELSE 'active'
                END as status
            FROM coupons c 
            ${whereClause}
            ORDER BY c.date_added DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            dbQuery(countQuery, params),
            dbQuery(dataQuery, [...params, limit, offset])
        ]);

        res.json({
            coupons: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// GET /api/coupons/:id - Get single coupon
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await dbQuery(`
            SELECT 
                c.*,
                CASE 
                    WHEN c.expiration_date IS NOT NULL AND c.expiration_date <= CURRENT_DATE THEN 'expired'
                    WHEN c.expiration_date IS NOT NULL AND c.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'expiring'
                    WHEN c.type = 'product' AND c.is_used = true THEN 'used'
                    WHEN c.type = 'money' AND c.remaining_amount <= 0 THEN 'used'
                    ELSE 'active'
                END as status
            FROM coupons c 
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // Get usage history for money coupons
        if (result.rows[0].type === 'money') {
            const usageResult = await dbQuery(
                'SELECT * FROM coupon_usage WHERE coupon_id = $1 ORDER BY usage_date DESC',
                [id]
            );
            result.rows[0].usage_history = usageResult.rows;
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ error: 'Failed to fetch coupon' });
    }
});

// POST /api/coupons - Create new coupon
router.post('/', [
    body('code').notEmpty().trim().withMessage('Code is required'),
    body('company').notEmpty().trim().withMessage('Company is required'),
    body('type').isIn(['money', 'product']).withMessage('Type must be money or product'),
    body('category').optional().trim(),
    body('notes').optional().trim(),
    body('expiration_date').optional().isISO8601().withMessage('Invalid date format'),
    
    // Money coupon validation
    body('original_amount').if(body('type').equals('money')).isFloat({ min: 0 }).withMessage('Amount must be positive'),
    body('currency').if(body('type').equals('money')).optional().trim(),
    
    // Product coupon validation
    body('product_description').if(body('type').equals('product')).notEmpty().withMessage('Product description is required for product coupons'),
], handleValidationErrors, async (req, res) => {
    try {
        const { 
            code, 
            company, 
            type, 
            original_amount, 
            currency = 'NIS',
            product_description, 
            category, 
            expiration_date, 
            notes 
        } = req.body;

        // Check if coupon code already exists
        const existingCoupon = await dbQuery('SELECT id FROM coupons WHERE code = $1', [code]);
        if (existingCoupon.rows.length > 0) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const id = uuidv4();
        const remaining_amount = type === 'money' ? original_amount : null;

        const result = await dbQuery(`
            INSERT INTO coupons (
                id, code, company, type, original_amount, remaining_amount, 
                currency, product_description, category, expiration_date, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            id, code, company, type, original_amount, remaining_amount,
            currency, product_description, category, expiration_date, notes
        ]);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// PUT /api/coupons/:id/use - Use coupon (partial or full)
router.put('/:id/use', [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
    body('notes').optional().trim()
], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes = '' } = req.body;

        // Get current coupon
        const couponResult = await dbQuery('SELECT * FROM coupons WHERE id = $1', [id]);
        if (couponResult.rows.length === 0) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        const coupon = couponResult.rows[0];

        if (coupon.type === 'product') {
            // Mark product coupon as used
            if (coupon.is_used) {
                return res.status(400).json({ error: 'Product coupon already used' });
            }

            await dbQuery(
                'UPDATE coupons SET is_used = true, last_used = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );

        } else if (coupon.type === 'money') {
            // Handle partial usage of money coupon
            if (!amount) {
                return res.status(400).json({ error: 'Amount is required for money coupons' });
            }

            if (amount > coupon.remaining_amount) {
                return res.status(400).json({ error: 'Amount exceeds remaining balance' });
            }

            const newRemainingAmount = coupon.remaining_amount - amount;

            // Update coupon
            await dbQuery(
                'UPDATE coupons SET remaining_amount = $1, last_used = CURRENT_TIMESTAMP WHERE id = $2',
                [newRemainingAmount, id]
            );

            // Record usage
            await dbQuery(
                'INSERT INTO coupon_usage (coupon_id, amount_used, notes) VALUES ($1, $2, $3)',
                [id, amount, notes]
            );
        }

        // Return updated coupon
        const updatedResult = await dbQuery('SELECT * FROM coupons WHERE id = $1', [id]);
        res.json(updatedResult.rows[0]);

    } catch (error) {
        console.error('Error using coupon:', error);
        res.status(500).json({ error: 'Failed to use coupon' });
    }
});

// DELETE /api/coupons/:id - Delete coupon
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbQuery('DELETE FROM coupons WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json({ message: 'Coupon deleted successfully' });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// GET /api/coupons/stats - Get statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await dbQuery(`
            SELECT 
                COUNT(*) as total_coupons,
                COUNT(CASE WHEN type = 'money' AND remaining_amount > 0 THEN 1 END) as active_money_coupons,
                COUNT(CASE WHEN type = 'product' AND is_used = false THEN 1 END) as active_product_coupons,
                COUNT(CASE WHEN expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as expiring_soon,
                COALESCE(SUM(CASE WHEN type = 'money' THEN remaining_amount ELSE 0 END), 0) as total_value,
                COUNT(DISTINCT company) as total_companies,
                COUNT(DISTINCT category) as total_categories
            FROM coupons
        `);

        res.json(stats.rows[0]);

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router; 