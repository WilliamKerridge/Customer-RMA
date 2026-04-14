-- Better-auth generates TEXT user IDs (not UUIDs).
-- Drop all policies that reference auth.uid() comparisons against uuid columns,
-- alter the column types to text, then recreate the policies.

BEGIN;

-- ── 1. Drop FK constraints ──────────────────────────────────────────────────
ALTER TABLE customer_accounts DROP CONSTRAINT IF EXISTS customer_accounts_user_id_fkey;
ALTER TABLE cases             DROP CONSTRAINT IF EXISTS cases_customer_id_fkey;
ALTER TABLE cases             DROP CONSTRAINT IF EXISTS cases_assigned_to_fkey;
ALTER TABLE case_updates      DROP CONSTRAINT IF EXISTS case_updates_author_id_fkey;
ALTER TABLE case_attachments  DROP CONSTRAINT IF EXISTS case_attachments_uploaded_by_fkey;

-- ── 2. Drop RLS policies that block column type changes ──────────────────────
DROP POLICY IF EXISTS "users_read_own"           ON users;
DROP POLICY IF EXISTS "users_read_staff"         ON users;
DROP POLICY IF EXISTS "users_update_own"         ON users;
DROP POLICY IF EXISTS "users_insert_service_role" ON users;

DROP POLICY IF EXISTS "accounts_read_own"        ON customer_accounts;
DROP POLICY IF EXISTS "accounts_read_staff"      ON customer_accounts;
DROP POLICY IF EXISTS "accounts_update_staff"    ON customer_accounts;
DROP POLICY IF EXISTS "accounts_insert_service_role" ON customer_accounts;

DROP POLICY IF EXISTS "cases_read_own"           ON cases;
DROP POLICY IF EXISTS "cases_read_staff_uk"      ON cases;
DROP POLICY IF EXISTS "cases_read_staff_us"      ON cases;
DROP POLICY IF EXISTS "cases_read_admin"         ON cases;
DROP POLICY IF EXISTS "cases_insert_authenticated" ON cases;
DROP POLICY IF EXISTS "cases_update_staff"       ON cases;

DROP POLICY IF EXISTS "case_products_read_own"   ON case_products;
DROP POLICY IF EXISTS "case_products_read_staff" ON case_products;
DROP POLICY IF EXISTS "case_products_insert"     ON case_products;
DROP POLICY IF EXISTS "case_products_update_staff" ON case_products;

DROP POLICY IF EXISTS "case_updates_read_own"    ON case_updates;
DROP POLICY IF EXISTS "case_updates_read_staff"  ON case_updates;
DROP POLICY IF EXISTS "case_updates_insert"      ON case_updates;

DROP POLICY IF EXISTS "case_attachments_read_own"   ON case_attachments;
DROP POLICY IF EXISTS "case_attachments_read_staff" ON case_attachments;
DROP POLICY IF EXISTS "case_attachments_insert"     ON case_attachments;

DROP POLICY IF EXISTS "response_tokens_read_own"      ON case_response_tokens;
DROP POLICY IF EXISTS "response_tokens_read_staff"    ON case_response_tokens;
DROP POLICY IF EXISTS "response_tokens_insert_staff"  ON case_response_tokens;
DROP POLICY IF EXISTS "response_tokens_update"        ON case_response_tokens;

DROP POLICY IF EXISTS "email_notifications_read_staff" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_insert"     ON email_notifications;

-- products (depend on current_user_role function)
DROP POLICY IF EXISTS "products_read_all"      ON products;
DROP POLICY IF EXISTS "products_write_staff"   ON products;
DROP POLICY IF EXISTS "products_update_staff"  ON products;
DROP POLICY IF EXISTS "products_delete_staff"  ON products;

-- ── 3. Drop the helper functions (they will be recreated) ───────────────────
DROP FUNCTION IF EXISTS current_user_role() CASCADE;
DROP FUNCTION IF EXISTS current_user_office() CASCADE;

-- ── 4. Alter users.id and all reference columns to TEXT ────────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE customer_accounts ALTER COLUMN user_id     TYPE TEXT;
ALTER TABLE cases             ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE cases             ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE case_updates      ALTER COLUMN author_id   TYPE TEXT;
ALTER TABLE case_attachments  ALTER COLUMN uploaded_by TYPE TEXT;

-- ── 5. Recreate helper functions ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_office()
RETURNS text AS $$
  SELECT office FROM users WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 6. Recreate all RLS policies ─────────────────────────────────────────────

-- users
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "users_read_staff" ON users
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "users_insert_service_role" ON users
  FOR INSERT WITH CHECK (true);

-- customer_accounts
CREATE POLICY "accounts_read_own" ON customer_accounts
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "accounts_read_staff" ON customer_accounts
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "accounts_update_staff" ON customer_accounts
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "accounts_insert_service_role" ON customer_accounts
  FOR INSERT WITH CHECK (true);

-- products
CREATE POLICY "products_read_all" ON products
  FOR SELECT USING (active = true OR current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_write_staff" ON products
  FOR INSERT WITH CHECK (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_update_staff" ON products
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_delete_staff" ON products
  FOR DELETE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- cases
CREATE POLICY "cases_read_own" ON cases
  FOR SELECT USING (customer_id = auth.uid()::text);

CREATE POLICY "cases_read_staff_uk" ON cases
  FOR SELECT USING (current_user_role() = 'staff_uk' AND office = 'UK');

CREATE POLICY "cases_read_staff_us" ON cases
  FOR SELECT USING (current_user_role() = 'staff_us' AND office = 'US');

CREATE POLICY "cases_read_admin" ON cases
  FOR SELECT USING (current_user_role() = 'admin');

CREATE POLICY "cases_insert_authenticated" ON cases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');

CREATE POLICY "cases_update_staff" ON cases
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- case_products
CREATE POLICY "case_products_read_own" ON case_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_products.case_id AND cases.customer_id = auth.uid()::text)
  );

CREATE POLICY "case_products_read_staff" ON case_products
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_products_insert" ON case_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "case_products_update_staff" ON case_products
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- case_updates
CREATE POLICY "case_updates_read_own" ON case_updates
  FOR SELECT USING (
    is_internal = false AND
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_updates.case_id AND cases.customer_id = auth.uid()::text)
  );

CREATE POLICY "case_updates_read_staff" ON case_updates
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_updates_insert" ON case_updates
  FOR INSERT WITH CHECK (true);

-- case_attachments
CREATE POLICY "case_attachments_read_own" ON case_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_attachments.case_id AND cases.customer_id = auth.uid()::text)
  );

CREATE POLICY "case_attachments_read_staff" ON case_attachments
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_attachments_insert" ON case_attachments
  FOR INSERT WITH CHECK (true);

-- case_response_tokens
CREATE POLICY "response_tokens_read_own" ON case_response_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_response_tokens.case_id AND cases.customer_id = auth.uid()::text)
  );

CREATE POLICY "response_tokens_read_staff" ON case_response_tokens
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "response_tokens_insert_staff" ON case_response_tokens
  FOR INSERT WITH CHECK (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "response_tokens_update" ON case_response_tokens
  FOR UPDATE USING (true);

-- email_notifications
CREATE POLICY "email_notifications_read_staff" ON email_notifications
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "email_notifications_insert" ON email_notifications
  FOR INSERT WITH CHECK (true);

COMMIT;
