ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_quote_requests_is_test ON public.quote_requests (is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_invoices_is_test ON public.invoices (is_test) WHERE is_test = true;