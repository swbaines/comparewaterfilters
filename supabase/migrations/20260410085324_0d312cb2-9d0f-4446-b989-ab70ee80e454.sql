
-- Create separate table for Stripe payment fields
CREATE TABLE public.provider_stripe_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE REFERENCES public.providers(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_payment_method_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_stripe_details ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage provider stripe details"
ON public.provider_stripe_details
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendors can read own stripe details (needed for billing portal)
CREATE POLICY "Vendors can read own stripe details"
ON public.provider_stripe_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_accounts va
    WHERE va.user_id = auth.uid()
    AND va.provider_id = provider_stripe_details.provider_id
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_provider_stripe_details_updated_at
BEFORE UPDATE ON public.provider_stripe_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data
INSERT INTO public.provider_stripe_details (provider_id, stripe_customer_id, stripe_payment_method_id)
SELECT id, stripe_customer_id, stripe_payment_method_id
FROM public.providers
WHERE stripe_customer_id IS NOT NULL OR stripe_payment_method_id IS NOT NULL;

-- Remove Stripe fields from providers table
ALTER TABLE public.providers DROP COLUMN stripe_customer_id;
ALTER TABLE public.providers DROP COLUMN stripe_payment_method_id;
