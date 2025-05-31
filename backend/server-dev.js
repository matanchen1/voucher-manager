const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock data storage
let mockCoupons = [
    {
        id: uuidv4(),
        code: 'SP500',
        company: 'Super Pharm',
        type: 'money',
        original_amount: 500,
        remaining_amount: 320,
        currency: 'NIS',
        category: 'Pharmacies',
        expiration_date: '2025-12-31',
        notes: 'Gift card from birthday',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    },
    {
        id: uuidv4(),
        code: 'RL200',
        company: 'Rami Levy',
        type: 'money',
        original_amount: 200,
        remaining_amount: 200,
        currency: 'NIS',
        category: 'Supermarkets',
        expiration_date: '2025-08-30',
        notes: 'Grocery voucher',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    },
    {
        id: uuidv4(),
        code: 'SHP150',
        company: 'Shufersal',
        type: 'money',
        original_amount: 150,
        remaining_amount: 100,
        currency: 'NIS',
        category: 'Supermarkets',
        expiration_date: '2025-11-20',
        notes: 'Weekly groceries',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    },
    {
        id: uuidv4(),
        code: 'SPA100',
        company: 'Aria Spa',
        type: 'product',
        product_description: 'Full body massage treatment',
        is_used: false,
        category: 'Beauty & Spa',
        expiration_date: '2025-06-30',
        notes: 'Anniversary gift',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    },
    {
        id: uuidv4(),
        code: 'IKEA300',
        company: 'IKEA',
        type: 'money',
        original_amount: 300,
        remaining_amount: 150,
        currency: 'NIS',
        category: 'Home & Garden',
        expiration_date: '2025-10-15',
        notes: 'Home renovation budget',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    },
    {
        id: uuidv4(),
        code: 'MCD50',
        company: 'McDonalds',
        type: 'money',
        original_amount: 50,
        remaining_amount: 35,
        currency: 'NIS',
        category: 'Restaurants',
        expiration_date: '2025-09-30',
        notes: 'Fast food treats',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_added: new Date().toISOString(),
        status: 'active'
    }
];

// Helper functions
function calculateStatus(coupon) {
    if (coupon.type === 'product' && coupon.is_used) {
        return 'used';
    }
    if (coupon.type === 'money' && coupon.remaining_amount <= 0) {
        return 'used';
    }
    
    if (coupon.expiration_date) {
        const expirationDate = new Date(coupon.expiration_date);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration < 0) {
            return 'expired';
        } else if (daysUntilExpiration <= 7) {
            return 'expiring';
        }
    }
    
    return 'active';
}

function updateCouponStatus(coupon) {
    coupon.status = calculateStatus(coupon);
    return coupon;
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get all coupons with filtering
app.get('/api/coupons', (req, res) => {
    try {
        let filteredCoupons = [...mockCoupons];
        
        // Update statuses
        filteredCoupons = filteredCoupons.map(updateCouponStatus);
        
        // Apply filters
        const { search, company, category, type, status, limit = 12, offset = 0 } = req.query;
        
        if (search) {
            const searchLower = search.toLowerCase();
            filteredCoupons = filteredCoupons.filter(coupon => 
                coupon.code.toLowerCase().includes(searchLower) ||
                coupon.company.toLowerCase().includes(searchLower) ||
                (coupon.product_description && coupon.product_description.toLowerCase().includes(searchLower))
            );
        }
        
        if (company) {
            filteredCoupons = filteredCoupons.filter(coupon => coupon.company === company);
        }
        
        if (category) {
            filteredCoupons = filteredCoupons.filter(coupon => coupon.category === category);
        }
        
        if (type) {
            filteredCoupons = filteredCoupons.filter(coupon => coupon.type === type);
        }
        
        if (status) {
            filteredCoupons = filteredCoupons.filter(coupon => coupon.status === status);
        }
        
        // Pagination
        const total = filteredCoupons.length;
        const paginatedCoupons = filteredCoupons.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            coupons: paginatedCoupons,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// Get single coupon
app.get('/api/coupons/:id', (req, res) => {
    try {
        const coupon = mockCoupons.find(c => c.id === req.params.id);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        res.json(updateCouponStatus(coupon));
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ error: 'Failed to fetch coupon' });
    }
});

// Create new coupon
app.post('/api/coupons', (req, res) => {
    try {
        const newCoupon = {
            id: uuidv4(),
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            date_added: new Date().toISOString()
        };
        
        // Set initial values for money coupons
        if (newCoupon.type === 'money') {
            newCoupon.remaining_amount = newCoupon.original_amount;
            newCoupon.currency = newCoupon.currency || 'NIS';
        } else {
            newCoupon.is_used = false;
        }
        
        newCoupon.status = calculateStatus(newCoupon);
        mockCoupons.push(newCoupon);
        
        res.status(201).json(newCoupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// Update coupon
app.put('/api/coupons/:id', (req, res) => {
    try {
        const couponIndex = mockCoupons.findIndex(c => c.id === req.params.id);
        if (couponIndex === -1) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        
        const existingCoupon = mockCoupons[couponIndex];
        const updatedCoupon = {
            ...existingCoupon,
            ...req.body,
            id: existingCoupon.id, // Keep original ID
            created_at: existingCoupon.created_at, // Keep original creation date
            updated_at: new Date().toISOString()
        };
        
        // For money coupons, preserve remaining amount unless original amount changed
        if (updatedCoupon.type === 'money') {
            // If original amount changed, we need to recalculate remaining amount proportionally
            if (req.body.original_amount && req.body.original_amount !== existingCoupon.original_amount) {
                const usedAmount = (existingCoupon.original_amount || 0) - (existingCoupon.remaining_amount || 0);
                updatedCoupon.remaining_amount = Math.max(0, updatedCoupon.original_amount - usedAmount);
            } else {
                updatedCoupon.remaining_amount = existingCoupon.remaining_amount;
            }
            updatedCoupon.currency = updatedCoupon.currency || 'NIS';
        } else {
            updatedCoupon.is_used = existingCoupon.is_used; // Preserve used status for product coupons
        }
        
        updatedCoupon.status = calculateStatus(updatedCoupon);
        mockCoupons[couponIndex] = updatedCoupon;
        
        res.json(updatedCoupon);
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ error: 'Failed to update coupon' });
    }
});

// Use coupon
app.put('/api/coupons/:id/use', (req, res) => {
    try {
        const couponIndex = mockCoupons.findIndex(c => c.id === req.params.id);
        if (couponIndex === -1) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        
        const coupon = mockCoupons[couponIndex];
        const { amount, notes } = req.body;
        
        // Initialize usage_history if it doesn't exist
        if (!coupon.usage_history) {
            coupon.usage_history = [];
        }
        
        if (coupon.type === 'product') {
            coupon.is_used = true;
            coupon.last_used = new Date().toISOString();
            
            // Add to usage history
            coupon.usage_history.push({
                date: new Date().toISOString(),
                type: 'used',
                notes: notes || 'Service voucher used'
            });
        } else if (coupon.type === 'money') {
            const useAmount = amount || coupon.remaining_amount;
            if (useAmount > coupon.remaining_amount) {
                return res.status(400).json({ error: 'Amount exceeds remaining balance' });
            }
            
            coupon.remaining_amount -= useAmount;
            coupon.last_used = new Date().toISOString();
            
            // Add to usage history
            coupon.usage_history.push({
                date: new Date().toISOString(),
                type: 'partial_use',
                amount: useAmount,
                currency: coupon.currency,
                remaining_after: coupon.remaining_amount,
                notes: notes || `Used ${useAmount} ${coupon.currency}`
            });
        }
        
        coupon.updated_at = new Date().toISOString();
        coupon.status = calculateStatus(coupon);
        mockCoupons[couponIndex] = coupon;
        
        res.json(coupon);
    } catch (error) {
        console.error('Error using coupon:', error);
        res.status(500).json({ error: 'Failed to use coupon' });
    }
});

// Delete coupon
app.delete('/api/coupons/:id', (req, res) => {
    try {
        const couponIndex = mockCoupons.findIndex(c => c.id === req.params.id);
        if (couponIndex === -1) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        
        mockCoupons.splice(couponIndex, 1);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// Get statistics
app.get('/api/coupons/stats/summary', (req, res) => {
    try {
        const couponsWithStatus = mockCoupons.map(updateCouponStatus);
        
        const stats = {
            total_coupons: couponsWithStatus.length,
            active_money_coupons: couponsWithStatus.filter(c => c.type === 'money' && c.status === 'active').length,
            active_product_coupons: couponsWithStatus.filter(c => c.type === 'product' && c.status === 'active').length,
            expiring_soon: couponsWithStatus.filter(c => c.status === 'expiring').length,
            total_value: couponsWithStatus
                .filter(c => c.type === 'money')
                .reduce((sum, c) => sum + (c.remaining_amount || 0), 0),
            total_companies: new Set(couponsWithStatus.map(c => c.company)).size,
            total_categories: new Set(couponsWithStatus.map(c => c.category).filter(Boolean)).size
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Development server running on port ${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
    console.log(`📝 Using mock data (no database required)`);
    console.log(`🎯 Frontend should be at http://localhost:3000`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
}); 