-- Create casting_orders table
CREATE TABLE casting_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create casting_memos table
CREATE TABLE casting_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_order_id UUID REFERENCES casting_orders(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  size TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_casting_orders_order_id ON casting_orders(order_id);
CREATE INDEX idx_casting_orders_order_number ON casting_orders(order_number);
CREATE INDEX idx_casting_memos_casting_order_id ON casting_memos(casting_order_id);
CREATE INDEX idx_casting_memos_order_id ON casting_memos(order_id);
CREATE INDEX idx_casting_memos_order_number ON casting_memos(order_number);

-- Add RLS policies
ALTER TABLE casting_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casting_memos ENABLE ROW LEVEL SECURITY;

-- Create policies for casting_orders
CREATE POLICY "Users can view casting orders" ON casting_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert casting orders" ON casting_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update casting orders" ON casting_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete casting orders" ON casting_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for casting_memos
CREATE POLICY "Users can view casting memos" ON casting_memos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert casting memos" ON casting_memos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update casting memos" ON casting_memos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete casting memos" ON casting_memos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RPC functions for casting orders
CREATE OR REPLACE FUNCTION get_all_casting_orders()
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  order_number TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT co.id, co.order_id, co.order_number, co.status, co.created_at, co.updated_at
  FROM casting_orders co
  ORDER BY co.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_casting_order_by_id(p_id UUID)
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  order_number TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT co.id, co.order_id, co.order_number, co.status, co.created_at, co.updated_at
  FROM casting_orders co
  WHERE co.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_casting_order_by_order_id(p_order_id TEXT)
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  order_number TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT co.id, co.order_id, co.order_number, co.status, co.created_at, co.updated_at
  FROM casting_orders co
  WHERE co.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_casting_order(
  p_order_id TEXT,
  p_order_number TEXT,
  p_status TEXT DEFAULT 'draft'
)
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  order_number TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO casting_orders (order_id, order_number, status)
  VALUES (p_order_id, p_order_number, p_status)
  RETURNING casting_orders.id INTO new_id;
  
  RETURN QUERY
  SELECT co.id, co.order_id, co.order_number, co.status, co.created_at, co.updated_at
  FROM casting_orders co
  WHERE co.id = new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_casting_order(
  p_id UUID,
  p_order_id TEXT DEFAULT NULL,
  p_order_number TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  order_id TEXT,
  order_number TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  UPDATE casting_orders
  SET 
    order_id = COALESCE(p_order_id, order_id),
    order_number = COALESCE(p_order_number, order_number),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN QUERY
  SELECT co.id, co.order_id, co.order_number, co.status, co.created_at, co.updated_at
  FROM casting_orders co
  WHERE co.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_casting_order(p_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM casting_orders WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC functions for casting memos
CREATE OR REPLACE FUNCTION get_all_casting_memos()
RETURNS TABLE (
  id UUID,
  casting_order_id UUID,
  order_id TEXT,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL,
  size TEXT,
  metal_type TEXT,
  comments TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.casting_order_id, cm.order_id, cm.order_number, cm.product_id, 
         cm.product_name, cm.product_image, cm.model_number, cm.style_number, 
         cm.quantity, cm.size, cm.metal_type, cm.comments, cm.created_at, cm.updated_at
  FROM casting_memos cm
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_casting_memos_by_order_id(p_order_id TEXT)
RETURNS TABLE (
  id UUID,
  casting_order_id UUID,
  order_id TEXT,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL,
  size TEXT,
  metal_type TEXT,
  comments TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.casting_order_id, cm.order_id, cm.order_number, cm.product_id, 
         cm.product_name, cm.product_image, cm.model_number, cm.style_number, 
         cm.quantity, cm.size, cm.metal_type, cm.comments, cm.created_at, cm.updated_at
  FROM casting_memos cm
  WHERE cm.order_id = p_order_id
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_casting_memos_by_casting_order_id(p_casting_order_id UUID)
RETURNS TABLE (
  id UUID,
  casting_order_id UUID,
  order_id TEXT,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL,
  size TEXT,
  metal_type TEXT,
  comments TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.casting_order_id, cm.order_id, cm.order_number, cm.product_id, 
         cm.product_name, cm.product_image, cm.model_number, cm.style_number, 
         cm.quantity, cm.size, cm.metal_type, cm.comments, cm.created_at, cm.updated_at
  FROM casting_memos cm
  WHERE cm.casting_order_id = p_casting_order_id
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_casting_memo(
  p_casting_order_id UUID,
  p_order_id TEXT,
  p_order_number TEXT,
  p_product_id TEXT,
  p_product_name TEXT,
  p_product_image TEXT DEFAULT NULL,
  p_model_number TEXT DEFAULT NULL,
  p_style_number TEXT DEFAULT NULL,
  p_quantity DECIMAL DEFAULT 1.0000,
  p_size TEXT,
  p_metal_type TEXT,
  p_comments TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  casting_order_id UUID,
  order_id TEXT,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL,
  size TEXT,
  metal_type TEXT,
  comments TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO casting_memos (
    casting_order_id, order_id, order_number, product_id, product_name, 
    product_image, model_number, style_number, quantity, size, metal_type, comments
  )
  VALUES (
    p_casting_order_id, p_order_id, p_order_number, p_product_id, p_product_name,
    p_product_image, p_model_number, p_style_number, p_quantity, p_size, p_metal_type, p_comments
  )
  RETURNING casting_memos.id INTO new_id;
  
  RETURN QUERY
  SELECT cm.id, cm.casting_order_id, cm.order_id, cm.order_number, cm.product_id, 
         cm.product_name, cm.product_image, cm.model_number, cm.style_number, 
         cm.quantity, cm.size, cm.metal_type, cm.comments, cm.created_at, cm.updated_at
  FROM casting_memos cm
  WHERE cm.id = new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_casting_memo(
  p_id UUID,
  p_product_id TEXT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL,
  p_product_image TEXT DEFAULT NULL,
  p_model_number TEXT DEFAULT NULL,
  p_style_number TEXT DEFAULT NULL,
  p_quantity DECIMAL DEFAULT NULL,
  p_size TEXT DEFAULT NULL,
  p_metal_type TEXT DEFAULT NULL,
  p_comments TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  casting_order_id UUID,
  order_id TEXT,
  order_number TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  model_number TEXT,
  style_number TEXT,
  quantity DECIMAL,
  size TEXT,
  metal_type TEXT,
  comments TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  UPDATE casting_memos
  SET 
    product_id = COALESCE(p_product_id, product_id),
    product_name = COALESCE(p_product_name, product_name),
    product_image = COALESCE(p_product_image, product_image),
    model_number = COALESCE(p_model_number, model_number),
    style_number = COALESCE(p_style_number, style_number),
    quantity = COALESCE(p_quantity, quantity),
    size = COALESCE(p_size, size),
    metal_type = COALESCE(p_metal_type, metal_type),
    comments = COALESCE(p_comments, comments),
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN QUERY
  SELECT cm.id, cm.casting_order_id, cm.order_id, cm.order_number, cm.product_id, 
         cm.product_name, cm.product_image, cm.model_number, cm.style_number, 
         cm.quantity, cm.size, cm.metal_type, cm.comments, cm.created_at, cm.updated_at
  FROM casting_memos cm
  WHERE cm.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_casting_memo(p_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM casting_memos WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
