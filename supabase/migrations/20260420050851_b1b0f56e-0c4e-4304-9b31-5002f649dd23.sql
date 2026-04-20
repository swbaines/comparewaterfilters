ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;