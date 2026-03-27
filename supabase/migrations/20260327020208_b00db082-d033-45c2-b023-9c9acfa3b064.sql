
-- Lead pricing per system type
CREATE TABLE public.lead_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_type text NOT NULL UNIQUE,
  price_per_lead numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead prices" ON public.lead_prices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lead prices are publicly readable" ON public.lead_prices
  FOR SELECT TO public USING (true);

-- Add lead status tracking to quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS lead_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invoice_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vendor_notes text DEFAULT NULL;

-- Vendor accounts: link auth users to providers
CREATE TABLE public.vendor_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);

ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vendor accounts" ON public.vendor_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can read own account" ON public.vendor_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Invoices table
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  lead_count integer NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz DEFAULT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = public.invoices.provider_id
    )
  );

-- Add vendor read policy for their own leads
CREATE POLICY "Vendors can view own leads" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_accounts va
      WHERE va.user_id = auth.uid() AND va.provider_id = public.quote_requests.provider_id
    )
  );

-- Add foreign key from quote_requests.invoice_id to invoices
ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Auto-update timestamps
CREATE TRIGGER update_lead_prices_updated_at
  BEFORE UPDATE ON public.lead_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
