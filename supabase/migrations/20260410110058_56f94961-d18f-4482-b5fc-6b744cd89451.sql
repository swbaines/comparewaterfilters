
-- Create a trigger function that auto-creates vendor_account when a provider is approved
CREATE OR REPLACE FUNCTION public.auto_link_vendor_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when approval_status changes to 'approved' and there's a submitted_by user
  IF NEW.approval_status = 'approved'
     AND (OLD.approval_status IS DISTINCT FROM 'approved')
     AND NEW.submitted_by IS NOT NULL
  THEN
    INSERT INTO public.vendor_accounts (user_id, provider_id)
    VALUES (NEW.submitted_by, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to the providers table
CREATE TRIGGER trg_auto_link_vendor_on_approval
AFTER UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_vendor_on_approval();
