
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_reminder_admin_notified_at timestamptz;

-- Backfill approved_at for already-approved providers
UPDATE public.providers
SET approved_at = COALESCE(updated_at, created_at)
WHERE approval_status = 'approved' AND approved_at IS NULL;

-- Trigger: stamp approved_at on transition to approved, reset reminder counters
CREATE OR REPLACE FUNCTION public.set_provider_approved_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'approved'
     AND (OLD.approval_status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := COALESCE(NEW.approved_at, now());
    NEW.setup_reminder_sent_at := NULL;
    NEW.setup_reminder_count := 0;
    NEW.setup_reminder_admin_notified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_provider_approved_at ON public.providers;
CREATE TRIGGER trg_set_provider_approved_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_approved_at();
