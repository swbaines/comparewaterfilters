
CREATE TABLE public.billing_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  actor_ip TEXT,
  actor_user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_audit_log_provider_created
  ON public.billing_audit_log (provider_id, created_at DESC);

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage billing audit log"
ON public.billing_audit_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view own billing audit log"
ON public.billing_audit_log
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.vendor_accounts va
  WHERE va.user_id = auth.uid()
    AND va.provider_id = billing_audit_log.provider_id
));

-- Trigger function: record payment method + direct debit changes
CREATE OR REPLACE FUNCTION public.log_billing_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Payment method
  IF TG_OP = 'INSERT' AND NEW.stripe_payment_method_id IS NOT NULL THEN
    INSERT INTO public.billing_audit_log (provider_id, event_type, actor_user_id, metadata)
    VALUES (NEW.provider_id, 'payment_method_saved', auth.uid(),
      jsonb_build_object('stripe_payment_method_id', NEW.stripe_payment_method_id));
  ELSIF TG_OP = 'UPDATE' AND NEW.stripe_payment_method_id IS DISTINCT FROM OLD.stripe_payment_method_id THEN
    INSERT INTO public.billing_audit_log (provider_id, event_type, actor_user_id, metadata)
    VALUES (
      NEW.provider_id,
      CASE WHEN OLD.stripe_payment_method_id IS NULL THEN 'payment_method_saved' ELSE 'payment_method_updated' END,
      auth.uid(),
      jsonb_build_object(
        'old_stripe_payment_method_id', OLD.stripe_payment_method_id,
        'new_stripe_payment_method_id', NEW.stripe_payment_method_id
      )
    );
  END IF;

  -- Direct debit authorisation
  IF TG_OP = 'INSERT' AND NEW.direct_debit_authorised_at IS NOT NULL THEN
    INSERT INTO public.billing_audit_log (provider_id, event_type, actor_user_id, actor_ip, actor_user_agent, metadata)
    VALUES (NEW.provider_id, 'direct_debit_authorised', auth.uid(),
      NEW.direct_debit_authorised_ip, NEW.direct_debit_authorised_user_agent,
      jsonb_build_object('authorised_at', NEW.direct_debit_authorised_at));
  ELSIF TG_OP = 'UPDATE' AND NEW.direct_debit_authorised_at IS DISTINCT FROM OLD.direct_debit_authorised_at
        AND NEW.direct_debit_authorised_at IS NOT NULL THEN
    INSERT INTO public.billing_audit_log (provider_id, event_type, actor_user_id, actor_ip, actor_user_agent, metadata)
    VALUES (
      NEW.provider_id,
      CASE WHEN OLD.direct_debit_authorised_at IS NULL THEN 'direct_debit_authorised' ELSE 'direct_debit_reauthorised' END,
      auth.uid(),
      NEW.direct_debit_authorised_ip,
      NEW.direct_debit_authorised_user_agent,
      jsonb_build_object(
        'old_authorised_at', OLD.direct_debit_authorised_at,
        'new_authorised_at', NEW.direct_debit_authorised_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_billing_status_change
AFTER INSERT OR UPDATE ON public.provider_stripe_details
FOR EACH ROW
EXECUTE FUNCTION public.log_billing_status_change();
