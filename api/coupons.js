const { v4: uuidv4 } = require('uuid');

// Mock data storage (in-memory for demo)
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

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
    setCorsHeaders(res);
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    
    try {
        // Remove 'api' from the path if present
        if (urlParts[0] === 'api') {
            urlParts.shift();
        }
        
        // Health check
        if (urlParts.length === 1 && urlParts[0] === 'health') {
            return res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        }
        
        // All coupon routes should start with 'coupons'
        if (urlParts[0] !== 'coupons') {
            return res.status(404).json({ error: 'Route not found' });
        }
        
        // GET /coupons - Get all coupons with filtering
        if (method === 'GET' && urlParts.length === 1) {
            let filteredCoupons = [...mockCoupons];
            
            // Update statuses
            filteredCoupons = filteredCoupons.map(updateCouponStatus);
            
            // Apply filters from query parameters
            const { search, company, category, type, status, limit = 12, offset = 0 } = req.query || {};
            
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
            
            return res.json({
                coupons: paginatedCoupons,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }
        
        // GET /coupons/stats/summary - Get statistics
        if (method === 'GET' && urlParts.length === 3 && urlParts[1] === 'stats' && urlParts[2] === 'summary') {
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
            
            return res.json(stats);
        }
        
        // GET /coupons/recent - Get recent coupons
        if (method === 'GET' && urlParts.length === 2 && urlParts[1] === 'recent') {
            const couponsWithStatus = mockCoupons.map(updateCouponStatus);
            
            // Sort by date_added (most recent first) and take the first 5
            const recentCoupons = couponsWithStatus
                .sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
                .slice(0, 5);
            
            return res.json(recentCoupons);
        }
        
        // GET /coupons/:id - Get single coupon
        if (method === 'GET' && urlParts.length === 2) {
            const coupon = mockCoupons.find(c => c.id === urlParts[1]);
            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            return res.json(updateCouponStatus(coupon));
        }
        
        // POST /coupons - Create new coupon
        if (method === 'POST' && urlParts.length === 1) {
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
            
            return res.status(201).json(newCoupon);
        }
        
        // PUT /coupons/:id - Update coupon
        if (method === 'PUT' && urlParts.length === 2 && !urlParts[2]) {
            const couponIndex = mockCoupons.findIndex(c => c.id === urlParts[1]);
            if (couponIndex === -1) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            
            const existingCoupon = mockCoupons[couponIndex];
            const updatedCoupon = {
                ...existingCoupon,
                ...req.body,
                id: existingCoupon.id,
                created_at: existingCoupon.created_at,
                updated_at: new Date().toISOString()
            };
            
            // For money coupons, preserve remaining amount unless original amount changed
            if (updatedCoupon.type === 'money') {
                if (req.body.original_amount && req.body.original_amount !== existingCoupon.original_amount) {
                    const usedAmount = (existingCoupon.original_amount || 0) - (existingCoupon.remaining_amount || 0);
                    updatedCoupon.remaining_amount = Math.max(0, updatedCoupon.original_amount - usedAmount);
                } else {
                    updatedCoupon.remaining_amount = existingCoupon.remaining_amount;
                }
                updatedCoupon.currency = updatedCoupon.currency || 'NIS';
            } else {
                updatedCoupon.is_used = existingCoupon.is_used;
            }
            
            updatedCoupon.status = calculateStatus(updatedCoupon);
            mockCoupons[couponIndex] = updatedCoupon;
            
            return res.json(updatedCoupon);
        }
        
        // PUT /coupons/:id/use - Use coupon
        if (method === 'PUT' && urlParts.length === 3 && urlParts[2] === 'use') {
            const couponIndex = mockCoupons.findIndex(c => c.id === urlParts[1]);
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
            
            return res.json(coupon);
        }
        
        // DELETE /coupons/:id - Delete coupon
        if (method === 'DELETE' && urlParts.length === 2) {
            const couponIndex = mockCoupons.findIndex(c => c.id === urlParts[1]);
            if (couponIndex === -1) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            
            mockCoupons.splice(couponIndex, 1);
            return res.status(204).end();
        }
        
        // Route not found
        return res.status(404).json({ error: 'Route not found' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}; 