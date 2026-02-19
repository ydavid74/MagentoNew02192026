-- Create diamond inventory table
CREATE TABLE IF NOT EXISTS diamond_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    parent_parcel_id VARCHAR(50) REFERENCES diamond_inventory(parcel_id),
    parcel_name VARCHAR(255) NOT NULL,
    total_carat DECIMAL(10,2),
    number_of_stones INTEGER,
    pct DECIMAL(10,2),
    price_per_ct DECIMAL(12,2),
    ws_price_per_ct DECIMAL(12,2),
    carat_category VARCHAR(50),
    color VARCHAR(10),
    shape VARCHAR(50),
    clarity VARCHAR(10),
    polish_symmetry VARCHAR(20),
    table_width DECIMAL(5,2),
    depth DECIMAL(5,2),
    girdle VARCHAR(20),
    fluorescence VARCHAR(20),
    culet VARCHAR(20),
    mm DECIMAL(5,2),
    certificate_type VARCHAR(50),
    comments TEXT,
    reason TEXT,
    days_active INTEGER DEFAULT 0,
    is_editable BOOLEAN DEFAULT true,
    is_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diamond history table
CREATE TABLE IF NOT EXISTS diamond_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee VARCHAR(255),
    type VARCHAR(50),
    stones INTEGER,
    carat_group VARCHAR(50),
    ct_weight DECIMAL(10,2),
    ct_price DECIMAL(12,2),
    order_id VARCHAR(50),
    comments TEXT,
    image_url TEXT,
    total_weight DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_parcel_id ON diamond_inventory(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_parent_parcel_id ON diamond_inventory(parent_parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_shape ON diamond_inventory(shape);
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_color ON diamond_inventory(color);
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_clarity ON diamond_inventory(clarity);
CREATE INDEX IF NOT EXISTS idx_diamond_inventory_days_active ON diamond_inventory(days_active);

CREATE INDEX IF NOT EXISTS idx_diamond_history_parcel_id ON diamond_history(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_history_date ON diamond_history(date);
CREATE INDEX IF NOT EXISTS idx_diamond_history_order_id ON diamond_history(order_id);

-- Enable Row Level Security
ALTER TABLE diamond_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for diamond_inventory
CREATE POLICY "Users can view diamond inventory" ON diamond_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert diamond inventory" ON diamond_inventory
    FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Admins can update diamond inventory" ON diamond_inventory
    FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Admins can delete diamond inventory" ON diamond_inventory
    FOR DELETE USING (auth.role() = 'admin');

-- Create RLS policies for diamond_history
CREATE POLICY "Users can view diamond history" ON diamond_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert diamond history" ON diamond_history
    FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Admins can update diamond history" ON diamond_history
    FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Admins can delete diamond history" ON diamond_history
    FOR DELETE USING (auth.role() = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_diamond_inventory_updated_at 
    BEFORE UPDATE ON diamond_inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO diamond_inventory (
    parcel_id, 
    parent_parcel_id, 
    parcel_name, 
    total_carat,
    number_of_stones,
    pct,
    price_per_ct,
    ws_price_per_ct,
    carat_category,
    color, 
    shape, 
    clarity, 
    polish_symmetry,
    table_width,
    depth,
    girdle,
    fluorescence,
    culet,
    mm, 
    certificate_type,
    comments,
    reason,
    days_active, 
    is_editable, 
    is_parent
) VALUES 
-- Parent parcels (no parent_parcel_id)
('PAR-001', NULL, 'Premium Round Collection', 5.50, 3, 1.83, 8500, 7200, '1.5-2.0', 'D', 'Round', 'VVS1', 'EX/EX', 58.5, 62.3, 'Medium', 'None', 'None', 7.5, 'GIA', 'Premium quality round diamonds', 'High-end collection', 15, true, true),
('PAR-002', NULL, 'Princess Cut Set', 6.00, 2, 3.00, 7200, 6100, '3.0+', 'E', 'Princess', 'VS1', 'VG/EX', 72.0, 68.5, 'Thin to Medium', 'Faint', 'None', 8.2, 'GIA', 'Beautiful princess cut diamonds', 'Wedding collection', 35, true, true),
('PAR-003', NULL, 'Oval Brilliant Family', 4.25, 2, 2.125, 5200, 4400, '2.0-3.0', 'F', 'Oval', 'SI1', 'VG/VG', 58.0, 62.0, 'Medium', 'None', 'None', 6.8, 'IGI', 'Classic oval diamonds', 'Family heirloom', 80, false, true),
('PAR-004', NULL, 'Emerald Cut Suite', 8.00, 3, 2.67, 4800, 4100, '2.0-3.0', 'G', 'Emerald', 'VS2', 'VG/VG', 65.0, 68.0, 'Medium', 'Faint', 'None', 10.5, 'GIA', 'Elegant emerald cut diamonds', 'Luxury suite', 150, false, true),

-- Sub-parcels (with parent_parcel_id)
('SUB-001A', 'PAR-001', 'Premium Round A', 1.50, 1, 1.50, 8500, 7200, '1.0-1.5', 'D', 'Round', 'VVS1', 'EX/EX', 58.5, 62.3, 'Medium', 'None', 'None', 7.5, 'GIA', 'Individual premium round', 'Single stone', 15, true, false),
('SUB-001B', 'PAR-001', 'Premium Round B', 2.00, 1, 2.00, 8500, 7200, '1.5-2.0', 'D', 'Round', 'VVS1', 'EX/EX', 58.5, 62.3, 'Medium', 'None', 'None', 8.0, 'GIA', 'Individual premium round', 'Single stone', 15, true, false),
('SUB-002A', 'PAR-002', 'Princess Cut A', 3.00, 1, 3.00, 7200, 6100, '3.0+', 'E', 'Princess', 'VS1', 'VG/EX', 72.0, 68.5, 'Thin to Medium', 'Faint', 'None', 8.2, 'GIA', 'Individual princess cut', 'Single stone', 35, true, false),
('SUB-003A', 'PAR-003', 'Oval Brilliant A', 2.125, 1, 2.125, 5200, 4400, '2.0-3.0', 'F', 'Oval', 'SI1', 'VG/VG', 58.0, 62.0, 'Medium', 'None', 'None', 6.8, 'IGI', 'Individual oval', 'Single stone', 80, false, false);

-- Insert sample history data
INSERT INTO diamond_history (
    parcel_id,
    website,
    date,
    employee,
    type,
    stones,
    carat_group,
    ct_weight,
    ct_price,
    order_id,
    comments,
    image_url,
    total_weight
) VALUES
('PAR-001', 'DiamondExchange.com', '2024-12-15 10:30:00', 'John Smith', 'Purchase', 3, '1.5-2.0', 5.50, 8500, 'ORD-001', 'Initial purchase for collection', 'https://example.com/image1.jpg', 5.50),
('PAR-001', 'Internal', '2024-12-16 14:20:00', 'Jane Doe', 'Split', 1, '1.0-1.5', 1.50, 8500, 'INT-001', 'Split into individual stones', 'https://example.com/image2.jpg', 1.50),
('PAR-002', 'DiamondWholesale.net', '2024-11-20 09:15:00', 'Mike Johnson', 'Purchase', 2, '3.0+', 6.00, 7200, 'ORD-002', 'Wedding collection addition', 'https://example.com/image3.jpg', 6.00),
('SUB-001A', 'Internal', '2024-12-16 15:45:00', 'Jane Doe', 'Sale', 1, '1.0-1.5', 1.50, 8500, 'SALE-001', 'Sold to customer', 'https://example.com/image4.jpg', 1.50);
