-- Create reports table for flood victim data
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lastname text,
  raw_message text NOT NULL,
  address text,
  location_lat numeric,
  location_long numeric,
  phone text[],
  number_of_adults integer DEFAULT 0,
  number_of_children integer DEFAULT 0,
  number_of_seniors integer DEFAULT 0,
  health_condition text,
  help_needed text,
  urgency_level integer DEFAULT 1 CHECK (urgency_level >= 1 AND urgency_level <= 5),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read reports (public access for emergency)
CREATE POLICY "Anyone can view reports"
  ON public.reports
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert reports (public reporting)
CREATE POLICY "Anyone can create reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update reports
CREATE POLICY "Anyone can update reports"
  ON public.reports
  FOR UPDATE
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_reports_urgency ON public.reports(urgency_level);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

-- Enable realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;