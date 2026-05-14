-- Re-state the vendor_accounts RLS policies explicitly so the access model is
-- self-documenting alongside the column-level privilege lock-down below.
-- Behaviour is unchanged from what's already in production; we drop & recreate
-- to make the intent obvious in this migration.

ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can read own account" ON public.vendor_accounts;
CREATE POLICY "Vendors can read own account"
  ON public.vendor_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vendors can update own account" ON public.vendor_accounts;
CREATE POLICY "Vendors can update own account"
  ON public.vendor_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin + INSERT policies are left as-is (already correct).

-- Column-level privilege layer: vendors must not be able to UPDATE the
-- acceptance fields, even on their own row. RLS in Postgres is row-scoped, not
-- column-scoped, so we enforce column scope via GRANT/REVOKE. The
-- `enforce_vendor_account_acceptance_immutable` BEFORE UPDATE trigger remains
-- as a second layer of defence.
REVOKE UPDATE (
  pricing_acknowledged_at,
  terms_accepted_at,
  installation_compliance_acknowledged_at,
  marketing_consent_at,
  legacy_terms
) ON public.vendor_accounts FROM authenticated, anon;

-- Operational columns vendors are allowed to update from the client.
GRANT UPDATE (
  last_dashboard_visit
) ON public.vendor_accounts TO authenticated;

-- Admins write via the service role (or the "Admins can manage vendor accounts"
-- ALL policy combined with the table-owner grant), so they retain full access.
