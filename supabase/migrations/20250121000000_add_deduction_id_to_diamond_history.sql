-- Add deduction_id column to diamond_history table
-- This will allow us to directly link history entries to specific deductions

ALTER TABLE diamond_history 
ADD COLUMN deduction_id UUID REFERENCES diamond_deductions(id) ON DELETE CASCADE;

-- Add index for better performance when querying by deduction_id
CREATE INDEX idx_diamond_history_deduction_id ON diamond_history(deduction_id);

-- Add comment to document the purpose
COMMENT ON COLUMN diamond_history.deduction_id IS 'References the diamond_deduction that created this history entry';
