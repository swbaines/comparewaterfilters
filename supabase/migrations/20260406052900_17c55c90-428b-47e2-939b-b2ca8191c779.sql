-- Add ownership_status column to quote_requests
ALTER TABLE public.quote_requests ADD COLUMN ownership_status text;

-- Update lead_prices to reflect ownership-based pricing
UPDATE public.lead_prices SET system_type = 'owner_lead', price_per_lead = 85, updated_at = now() WHERE system_type = 'owner';
UPDATE public.lead_prices SET system_type = 'rental_lead', price_per_lead = 50, updated_at = now() WHERE system_type = 'rental';