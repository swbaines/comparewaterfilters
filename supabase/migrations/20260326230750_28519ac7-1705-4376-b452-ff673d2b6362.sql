
-- Create price_range enum
CREATE TYPE public.price_range AS ENUM ('budget', 'mid', 'premium');

-- Create providers table
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  logo TEXT,
  states TEXT[] NOT NULL DEFAULT '{}',
  postcode_ranges TEXT[] DEFAULT '{}',
  system_types TEXT[] NOT NULL DEFAULT '{}',
  brands TEXT[] NOT NULL DEFAULT '{}',
  price_range public.price_range NOT NULL DEFAULT 'mid',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  years_in_business INTEGER NOT NULL DEFAULT 0,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  available_for_quote BOOLEAN NOT NULL DEFAULT true,
  response_time TEXT NOT NULL DEFAULT 'Within 48 hours',
  warranty TEXT NOT NULL DEFAULT '',
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_mobile TEXT,
  customer_suburb TEXT,
  customer_state TEXT,
  customer_postcode TEXT,
  property_type TEXT,
  household_size TEXT,
  water_source TEXT,
  concerns TEXT[] DEFAULT '{}',
  budget TEXT,
  recommended_systems TEXT[] DEFAULT '{}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Providers are publicly readable (needed for quiz results)
CREATE POLICY "Providers are publicly readable"
  ON public.providers FOR SELECT
  USING (true);

-- Allow anonymous inserts for quote requests (public form submission)
CREATE POLICY "Anyone can submit a quote request"
  ON public.quote_requests FOR INSERT
  WITH CHECK (true);

-- Quote requests readable only by authenticated users (admin)
CREATE POLICY "Authenticated users can read quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users full CRUD on providers (admin)
CREATE POLICY "Authenticated users can insert providers"
  ON public.providers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update providers"
  ON public.providers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete providers"
  ON public.providers FOR DELETE
  TO authenticated
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
