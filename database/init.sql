-- Create the coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    company VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('money', 'product')),
    
    -- For money coupons
    original_amount DECIMAL(10,2),
    remaining_amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'NIS',
    
    -- For product coupons
    product_description TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Common fields
    category VARCHAR(255),
    expiration_date DATE,
    notes TEXT,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    
    -- Indexes for performance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usage history table for tracking partial usage of money coupons
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    amount_used DECIMAL(10,2) NOT NULL,
    usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_company ON coupons(company);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons(category);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_expiration ON coupons(expiration_date);
CREATE INDEX IF NOT EXISTS idx_coupons_date_added ON coupons(date_added);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);

-- Insert some sample data for testing
INSERT INTO coupons (code, company, type, original_amount, remaining_amount, currency, category, expiration_date, notes) VALUES
('SAVE50', 'Costco', 'money', 50.00, 50.00, 'NIS', 'Retail', '2025-12-31', 'New customer discount'),
('BURGER123', 'McDonald''s', 'product', NULL, NULL, NULL, 'Food', '2025-06-30', 'Free Big Mac'),
('WELCOME25', 'IKEA', 'money', 100.00, 75.00, 'NIS', 'Furniture', '2025-08-15', 'Welcome bonus - 25 NIS already used');

-- Insert usage history for the partially used coupon
INSERT INTO coupon_usage (coupon_id, amount_used, notes) 
SELECT id, 25.00, 'Used for small items' 
FROM coupons 
WHERE code = 'WELCOME25';

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update the updated_at column
CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 