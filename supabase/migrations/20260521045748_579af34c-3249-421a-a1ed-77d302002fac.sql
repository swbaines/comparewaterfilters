CREATE TABLE public.provider_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  quote_request_id uuid,
  amount numeric NOT NULL CHECK (amount > 0),
  reason text,
  status text NOT NULL DEFAULT 'pending',
  applied_invoice_id uuid,
  applied_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_credits_pending
  ON public.provider_credits(provider_id) WHERE status = 'pending';
CREATE INDEX idx_provider_credits_quote_request
  ON public.provider_credits(quote_request_id);

ALTER TABLE public.provider_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage provider credits"
  ON public.provider_credits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors view own provider credits"
  ON public.provider_credits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = provider_credits.provider_id
  ));

CREATE TRIGGER trg_provider_credits_updated_at
  BEFORE UPDATE ON public.provider_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();