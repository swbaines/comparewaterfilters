
-- 1. Fix storage policies on vendor-insurance-certificates bucket.
DROP POLICY IF EXISTS "Applicants can upload insurance certificate during signup" ON storage.objects;
CREATE POLICY "Applicants can upload insurance certificate during signup"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-insurance-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.providers p WHERE p.submitted_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Applicants can read own insurance certificate" ON storage.objects;
CREATE POLICY "Applicants can read own insurance certificate"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.providers p WHERE p.submitted_by = auth.uid()
  )
);

-- 2. Trigger to enforce vendor column restrictions on providers.
CREATE OR REPLACE FUNCTION public.enforce_vendor_provider_column_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role and admins full update.
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status      IS DISTINCT FROM OLD.approval_status
     OR NEW.abn_verified                  IS DISTINCT FROM OLD.abn_verified
     OR NEW.abn_verified_at               IS DISTINCT FROM OLD.abn_verified_at
     OR NEW.abn_verification_response     IS DISTINCT FROM OLD.abn_verification_response
     OR NEW.abn_review_flag               IS DISTINCT FROM OLD.abn_review_flag
     OR NEW.approved_at                   IS DISTINCT FROM OLD.approved_at
     OR NEW.insurance_paused_at           IS DISTINCT FROM OLD.insurance_paused_at
     OR NEW.submitted_by                  IS DISTINCT FROM OLD.submitted_by
     OR NEW.rating                        IS DISTINCT FROM OLD.rating
     OR NEW.review_count                  IS DISTINCT FROM OLD.review_count
     OR NEW.setup_reminder_count          IS DISTINCT FROM OLD.setup_reminder_count
     OR NEW.setup_reminder_sent_at        IS DISTINCT FROM OLD.setup_reminder_sent_at
     OR NEW.setup_reminder_admin_notified_at IS DISTINCT FROM OLD.setup_reminder_admin_notified_at
     OR NEW.terms_accepted_at             IS DISTINCT FROM OLD.terms_accepted_at
     OR NEW.sub_contractor_confirmation_at IS DISTINCT FROM OLD.sub_contractor_confirmation_at
  THEN
    RAISE EXCEPTION 'Permission denied: vendors cannot modify protected provider columns';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vendor_provider_column_restrictions ON public.providers;
CREATE TRIGGER enforce_vendor_provider_column_restrictions
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_provider_column_restrictions();

-- 3. Trigger to enforce vendor column restrictions on quote_requests.
CREATE OR REPLACE FUNCTION public.enforce_vendor_quote_request_column_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.invoice_id          IS DISTINCT FROM OLD.invoice_id
     OR NEW.lead_price       IS DISTINCT FROM OLD.lead_price
     OR NEW.is_test          IS DISTINCT FROM OLD.is_test
     OR NEW.provider_id      IS DISTINCT FROM OLD.provider_id
     OR NEW.provider_name    IS DISTINCT FROM OLD.provider_name
     OR NEW.customer_email   IS DISTINCT FROM OLD.customer_email
     OR NEW.customer_mobile  IS DISTINCT FROM OLD.customer_mobile
     OR NEW.customer_name    IS DISTINCT FROM OLD.customer_name
     OR NEW.customer_state   IS DISTINCT FROM OLD.customer_state
     OR NEW.customer_suburb  IS DISTINCT FROM OLD.customer_suburb
     OR NEW.customer_postcode IS DISTINCT FROM OLD.customer_postcode
     OR NEW.recommended_systems IS DISTINCT FROM OLD.recommended_systems
     OR NEW.lead_temperature IS DISTINCT FROM OLD.lead_temperature
     OR NEW.created_at       IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Permission denied: vendors may only update lead status, vendor notes, and response timestamps';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vendor_quote_request_column_restrictions ON public.quote_requests;
CREATE TRIGGER enforce_vendor_quote_request_column_restrictions
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_quote_request_column_restrictions();

-- 4. Prevent vendors from re-targeting their vendor_account to a different provider or user.
CREATE OR REPLACE FUNCTION public.enforce_vendor_account_immutable_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'Permission denied: vendor account links cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vendor_account_immutable_links ON public.vendor_accounts;
CREATE TRIGGER enforce_vendor_account_immutable_links
BEFORE UPDATE ON public.vendor_accounts
FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_account_immutable_links();

-- 5. Restrict lead_price_changes read access to admins only.
DROP POLICY IF EXISTS "Authenticated users can view price changes" ON public.lead_price_changes;
