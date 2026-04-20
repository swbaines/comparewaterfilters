ALTER TABLE public.vendor_accounts
ADD COLUMN IF NOT EXISTS last_dashboard_visit TIMESTAMP WITH TIME ZONE;