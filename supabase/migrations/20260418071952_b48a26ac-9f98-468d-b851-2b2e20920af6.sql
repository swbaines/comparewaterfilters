-- 1. Lead price changes log table
CREATE TABLE public.lead_price_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_type TEXT NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_price_changes_effective ON public.lead_price_changes(effective_date DESC);
CREATE INDEX idx_lead_price_changes_system_type ON public.lead_price_changes(system_type);

ALTER TABLE public.lead_price_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead price changes"
ON public.lead_price_changes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view price changes"
ON public.lead_price_changes
FOR SELECT
TO authenticated
USING (true);

-- 2. Trigger function to auto-log changes with 30-day effective date
CREATE OR REPLACE FUNCTION public.log_lead_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price_per_lead IS DISTINCT FROM OLD.price_per_lead THEN
    INSERT INTO public.lead_price_changes (system_type, old_price, new_price, effective_date, changed_by)
    VALUES (
      NEW.system_type,
      OLD.price_per_lead,
      NEW.price_per_lead,
      now() + INTERVAL '30 days',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_lead_price_change
AFTER UPDATE ON public.lead_prices
FOR EACH ROW
EXECUTE FUNCTION public.log_lead_price_change();