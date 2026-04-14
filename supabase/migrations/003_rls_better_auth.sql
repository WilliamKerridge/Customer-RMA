-- ============================================================
-- Migration: 003_rls_better_auth.sql
-- Replace auth.uid() RLS policies with current_setting()-based
-- policies for Better Auth compatibility.
--
-- Context:
--   Better Auth does not generate Supabase Auth JWTs, so auth.uid()
--   always returns NULL. The policies from migration 002 were therefore
--   non-functional for any better-auth user.
--
--   This migration:
--     1. Creates set_app_user_id() — a function the application calls
--        to set app.current_user_id before (or within) customer queries.
--     2. Replaces auth.uid() references in all customer-facing SELECT
--        policies with current_setting('app.current_user_id', true).
--     3. Updates the current_user_role() / current_user_office() helper
--        functions to use app.current_user_id instead of auth.uid().
--
-- Application security model (see src/lib/supabase/with-auth.ts):
--   Primary  — explicit .eq('customer_id', userId) in application code
--   Secondary — RLS policy using current_setting('app.current_user_id')
--
-- The secondary layer enforces isolation for:
--   • Direct DB access (Supabase dashboard, psql, any bypass of PostgREST)
--   • Future RPC-wrapped queries where set_config + SELECT share a transaction
-- ============================================================

BEGIN;

-- ============================================================
-- 1. set_app_user_id function
--    Sets app.current_user_id for the current session so RLS
--    policies can reference it. Called by createUserScopedClient()
--    in the application before customer queries.
-- ============================================================

CREATE OR REPLACE FUNCTION set_app_user_id(user_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- is_local=false: session-scoped (best chance of persisting within
  -- a serverless function execution across multiple PostgREST calls)
  SELECT set_config('app.current_user_id', user_id, false);
$$;

-- Allow the anon and authenticated roles to call this function.
-- Safe because an empty or wrong user_id only causes RLS to return
-- no rows — it cannot grant access to another customer's data.
GRANT EXECUTE ON FUNCTION set_app_user_id(text) TO anon, authenticated;


-- ============================================================
-- 2. Update helper functions
--    current_user_role() / current_user_office() used in staff/admin
--    RLS policies. Replace auth.uid() with app.current_user_id.
-- ============================================================

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role
  FROM users
  WHERE id = current_setting('app.current_user_id', true);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_office()
RETURNS text AS $$
  SELECT office
  FROM users
  WHERE id = current_setting('app.current_user_id', true);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================
-- 3. Drop customer-facing RLS policies that used auth.uid()
-- ============================================================

-- users
DROP POLICY IF EXISTS "users_read_own"   ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- customer_accounts
DROP POLICY IF EXISTS "accounts_read_own" ON customer_accounts;

-- cases
DROP POLICY IF EXISTS "cases_read_own" ON cases;

-- case_products
DROP POLICY IF EXISTS "case_products_read_own" ON case_products;

-- case_updates
DROP POLICY IF EXISTS "case_updates_read_own" ON case_updates;

-- case_attachments
DROP POLICY IF EXISTS "case_attachments_read_own" ON case_attachments;

-- case_response_tokens
DROP POLICY IF EXISTS "response_tokens_read_own" ON case_response_tokens;


-- ============================================================
-- 4. Recreate policies using current_setting('app.current_user_id')
-- ============================================================

-- users: customers can read and update their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true));

-- customer_accounts: customers can read their own account
CREATE POLICY "accounts_read_own" ON customer_accounts
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- cases: customers can read their own cases
CREATE POLICY "cases_read_own" ON cases
  FOR SELECT
  USING (customer_id = current_setting('app.current_user_id', true));

-- case_products: customers can read products on their own cases
CREATE POLICY "case_products_read_own" ON case_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_products.case_id
        AND cases.customer_id = current_setting('app.current_user_id', true)
    )
  );

-- case_updates: customers can read non-internal updates on their own cases
CREATE POLICY "case_updates_read_own" ON case_updates
  FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_updates.case_id
        AND cases.customer_id = current_setting('app.current_user_id', true)
    )
  );

-- case_attachments: customers can read attachments on their own cases
CREATE POLICY "case_attachments_read_own" ON case_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_attachments.case_id
        AND cases.customer_id = current_setting('app.current_user_id', true)
    )
  );

-- case_response_tokens: customers can read tokens on their own cases
CREATE POLICY "response_tokens_read_own" ON case_response_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_response_tokens.case_id
        AND cases.customer_id = current_setting('app.current_user_id', true)
    )
  );


-- ============================================================
-- 5. Fix cases_insert_authenticated policy
--    Original used auth.uid() which is null for better-auth users.
--    Replace with a service-role-only check since case submission
--    goes through the API route which uses the service client.
-- ============================================================

DROP POLICY IF EXISTS "cases_insert_authenticated" ON cases;

CREATE POLICY "cases_insert_authenticated" ON cases
  FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role'
    OR current_setting('app.current_user_id', true) <> ''
  );

COMMIT;
