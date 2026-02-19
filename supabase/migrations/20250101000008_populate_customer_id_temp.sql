-- Populate customer_id field with temporary random numbers
-- This is a temporary solution until proper customer IDs are assigned

-- Update existing customers with random 6-digit numbers
UPDATE public.customers 
SET customer_id = 'CUST-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0')
WHERE customer_id IS NULL;

-- Ensure uniqueness by handling any potential duplicates
-- If duplicates exist, regenerate with different numbers
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    LOOP
        -- Check for duplicates
        SELECT COUNT(*) INTO duplicate_count
        FROM (
            SELECT customer_id, COUNT(*)
            FROM public.customers
            WHERE customer_id IS NOT NULL
            GROUP BY customer_id
            HAVING COUNT(*) > 1
        ) duplicates;
        
        -- If no duplicates, exit loop
        EXIT WHEN duplicate_count = 0;
        
        -- Regenerate duplicates with new random numbers
        UPDATE public.customers 
        SET customer_id = 'CUST-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0')
        WHERE id IN (
            SELECT c1.id
            FROM public.customers c1
            INNER JOIN (
                SELECT customer_id
                FROM public.customers
                WHERE customer_id IS NOT NULL
                GROUP BY customer_id
                HAVING COUNT(*) > 1
            ) c2 ON c1.customer_id = c2.customer_id
        );
    END LOOP;
END $$;

-- Verify all customers now have unique customer_id values
-- This will show any remaining NULL values (should be 0)
SELECT COUNT(*) as customers_without_id 
FROM public.customers 
WHERE customer_id IS NULL;
