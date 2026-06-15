-- ============================================================
-- 013: Expand fee_basis to cover all repair types
-- ============================================================
-- Adds test / major / service repair types and warranty_foc,
-- replacing the old three-value constraint.
--
-- test         — test fee applies
-- standard     — standard repair fee applies
-- major        — major repair fee applies
-- service      — service fee applies
-- foc          — free of charge (goodwill / commercial decision)
-- warranty_foc — covered under warranty, no charge

-- Drop the old CHECK constraint
ALTER TABLE case_products DROP CONSTRAINT IF EXISTS case_products_fee_basis_check;

-- Migrate existing warranty rows to warranty_foc
UPDATE case_products SET fee_basis = 'warranty_foc' WHERE fee_basis = 'warranty';

-- Add the new expanded constraint
ALTER TABLE case_products
  ADD CONSTRAINT case_products_fee_basis_check
  CHECK (fee_basis IN ('test', 'standard', 'major', 'service', 'foc', 'warranty_foc'));
