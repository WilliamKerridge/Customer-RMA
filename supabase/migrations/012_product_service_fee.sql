-- Add service_fee column to products table.
-- Used when the customer selects 'End of Season Service' or 'Service Plan' as the fault type.
-- Loan Unit Return carries no fee and does not use this column.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS service_fee numeric(10,2) NOT NULL DEFAULT 0;
