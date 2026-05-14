
-- 1. Revoke EXECUTE on internal SECURITY DEFINER trigger/utility functions.
-- These only run from triggers or service-role contexts; they should not be
-- callable via PostgREST by anon or signed-in users.
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.auto_link_vendor_on_approval()',
    'public.set_provider_approved_at()',
    'public.log_billing_status_change()',
    'public.log_lead_price_change()',
    'public.log_quote_request_lead_temperature()',
    'public.enforce_vendor_account_immutable_links()',
    'public.enforce_vendor_provider_column_restrictions()',
    'public.enforce_vendor_quote_request_column_restrictions()',
    'public.trigger_saleshandy_sync()',
    'public.trigger_saleshandy_sync_quiz()',
    'public.enqueue_email(text, jsonb)',
    'public.read_email_batch(text, integer, integer)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.delete_email(text, bigint)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 2. Lock down vendor self-updates to acceptance columns.
-- Vendors can read their row and update operational fields (e.g. last_dashboard_visit),
-- but acceptance timestamps and legacy_terms must be immutable from the client.
CREATE OR REPLACE FUNCTION public.enforce_vendor_account_acceptance_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.pricing_acknowledged_at                 IS DISTINCT FROM OLD.pricing_acknowledged_at
     OR NEW.terms_accepted_at                    IS DISTINCT FROM OLD.terms_accepted_at
     OR NEW.installation_compliance_acknowledged_at IS DISTINCT FROM OLD.installation_compliance_acknowledged_at
     OR NEW.marketing_consent_at                 IS DISTINCT FROM OLD.marketing_consent_at
     OR NEW.legacy_terms                         IS DISTINCT FROM OLD.legacy_terms
  THEN
    RAISE EXCEPTION 'Permission denied: acceptance fields are immutable from the vendor client';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_vendor_account_acceptance_immutable() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_vendor_account_acceptance_immutable ON public.vendor_accounts;
CREATE TRIGGER enforce_vendor_account_acceptance_immutable
BEFORE UPDATE ON public.vendor_accounts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_vendor_account_acceptance_immutable();
