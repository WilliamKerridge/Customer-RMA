-- ============================================================
-- 010: Ensure demo account roles are correct
-- ============================================================
-- Safe to run even if accounts don't exist yet (WHERE email = ...
-- simply matches 0 rows). Re-runnable: UPDATE is idempotent.
-- Run this in the Supabase SQL editor if demo accounts were
-- registered via the app form before the seed's UPDATE statements
-- were applied (registration always creates role = 'customer').
-- ============================================================

UPDATE users SET role = 'customer', office = NULL
WHERE email = 'demo.customer@btsport.com';

UPDATE users SET role = 'customer', office = NULL
WHERE email = 'demo.customer2@tfsport.com';

UPDATE users SET role = 'staff_uk', office = 'UK'
WHERE email = 'demo.staff@cosworth.com';

UPDATE users SET role = 'admin', office = 'UK'
WHERE email = 'demo.admin@cosworth.com';
