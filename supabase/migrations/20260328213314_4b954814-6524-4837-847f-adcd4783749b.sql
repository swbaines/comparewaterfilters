
CREATE TABLE public.quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  email text NOT NULL,
  mobile text,
  postcode text,
  suburb text,
  state text,
  property_type text,
  ownership_status text,
  household_size text,
  bathrooms text,
  water_source text,
  concerns text[] DEFAULT '{}'::text[],
  coverage text,
  budget text,
  priorities text[] DEFAULT '{}'::text[],
  notes text,
  consent boolean DEFAULT false
);

ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit quiz" ON public.quiz_submissions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can read quiz submissions" ON public.quiz_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
