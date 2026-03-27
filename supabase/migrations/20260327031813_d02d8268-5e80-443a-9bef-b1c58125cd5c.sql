
CREATE TABLE public.vendor_payment_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  abn TEXT NOT NULL DEFAULT '',
  business_address TEXT NOT NULL DEFAULT '',
  business_suburb TEXT NOT NULL DEFAULT '',
  business_state TEXT NOT NULL DEFAULT '',
  business_postcode TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  bsb TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

ALTER TABLE public.vendor_payment_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own payment details"
  ON public.vendor_payment_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = vendor_payment_details.provider_id
    )
  );

CREATE POLICY "Vendors can insert own payment details"
  ON public.vendor_payment_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = vendor_payment_details.provider_id
    )
  );

CREATE POLICY "Vendors can update own payment details"
  ON public.vendor_payment_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = vendor_payment_details.provider_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = vendor_payment_details.provider_id
    )
  );

CREATE POLICY "Admins can manage all payment details"
  ON public.vendor_payment_details
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
