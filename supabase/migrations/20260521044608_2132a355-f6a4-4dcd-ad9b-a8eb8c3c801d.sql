ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS flagged_for_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS flag_admin_status text;

CREATE INDEX IF NOT EXISTS idx_quote_requests_flagged_for_review
  ON public.quote_requests (flagged_for_review)
  WHERE flagged_for_review = true;

-- Update vendor column restriction trigger to protect flag_admin_status and flagged_at from vendor tampering
-- (vendors may set flag fields when raising a flag, but not the admin-only status field)
CREATE OR REPLACE FUNCTION public.enforce_vendor_quote_request_column_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     OR NEW.flag_admin_status IS DISTINCT FROM OLD.flag_admin_status
  THEN
    RAISE EXCEPTION 'Permission denied: vendors may only update lead status, vendor notes, response timestamps, and flag fields';
  END IF;

  RETURN NEW;
END;
$function$;
