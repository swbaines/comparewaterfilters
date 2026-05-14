-- Add per-checkbox acceptance timestamps to providers (captured at registration)
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS pricing_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS installation_compliance_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

-- Mirror onto vendor_accounts (audit trail at the user/account level)
ALTER TABLE public.vendor_accounts
  ADD COLUMN IF NOT EXISTS pricing_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS installation_compliance_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS legacy_terms boolean NOT NULL DEFAULT false;

-- Backfill: existing vendor accounts predate the new flow → mark as legacy
UPDATE public.vendor_accounts
SET legacy_terms = true
WHERE pricing_acknowledged_at IS NULL
  AND terms_accepted_at IS NULL
  AND installation_compliance_acknowledged_at IS NULL
  AND marketing_consent_at IS NULL;

-- Update auto-link trigger to copy acceptance timestamps from provider → vendor account
CREATE OR REPLACE FUNCTION public.auto_link_vendor_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.approval_status = 'approved'
     AND (OLD.approval_status IS DISTINCT FROM 'approved')
     AND NEW.submitted_by IS NOT NULL
  THEN
    INSERT INTO public.vendor_accounts (
      user_id,
      provider_id,
      pricing_acknowledged_at,
      terms_accepted_at,
      installation_compliance_acknowledged_at,
      marketing_consent_at,
      legacy_terms
    )
    VALUES (
      NEW.submitted_by,
      NEW.id,
      NEW.pricing_acknowledged_at,
      NEW.terms_accepted_at,
      NEW.installation_compliance_acknowledged_at,
      NEW.marketing_consent_at,
      -- Vendors who registered before the four-checkbox flow won't have all
      -- four timestamps populated; flag them so the dashboard can prompt.
      CASE
        WHEN NEW.pricing_acknowledged_at IS NOT NULL
         AND NEW.terms_accepted_at IS NOT NULL
         AND NEW.installation_compliance_acknowledged_at IS NOT NULL
         AND NEW.marketing_consent_at IS NOT NULL
        THEN false
        ELSE true
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;