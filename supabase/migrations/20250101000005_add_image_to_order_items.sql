-- Add image column to order_items table
-- Migration: 20250101000005_add_image_to_order_items.sql

-- Add image column to store product image URLs
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.order_items.image IS 'URL or path to the product image';

-- Create index for better performance when querying by image
CREATE INDEX IF NOT EXISTS idx_order_items_image ON public.order_items(image) WHERE image IS NOT NULL;
