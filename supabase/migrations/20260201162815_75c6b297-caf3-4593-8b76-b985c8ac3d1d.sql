-- Add guest customer fields to jobs table (for customers without account)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS guest_name text,
ADD COLUMN IF NOT EXISTS guest_email text,
ADD COLUMN IF NOT EXISTS guest_phone text,
ADD COLUMN IF NOT EXISTS preferred_time_slot public.time_slot;

-- Add claim system fields
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.technicians(id),
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_open_for_claim boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS dispatcher_notes text;

-- Create technician availability table for daily planning
CREATE TABLE IF NOT EXISTS public.technician_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  date date NOT NULL,
  morning boolean DEFAULT false,
  afternoon boolean DEFAULT false,
  evening boolean DEFAULT false,
  night boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(technician_id, date)
);

-- Enable RLS on technician_availability
ALTER TABLE public.technician_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for technician_availability
CREATE POLICY "Technicians can manage their own availability"
ON public.technician_availability
FOR ALL
USING (technician_id IN (
  SELECT id FROM technicians WHERE user_id = auth.uid()
))
WITH CHECK (technician_id IN (
  SELECT id FROM technicians WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all availability"
ON public.technician_availability
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all availability"
ON public.technician_availability
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update jobs RLS to allow anonymous inserts (guest bookings)
DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;

CREATE POLICY "Anyone can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (true);

-- Allow viewing guest jobs by email (for confirmation page)
CREATE POLICY "Guests can view their jobs by email"
ON public.jobs
FOR SELECT
USING (guest_email IS NOT NULL);

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('job-photos', 'job-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job photos
CREATE POLICY "Anyone can upload job photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Anyone can view job photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-photos');

-- Trigger for updating technician_availability updated_at
CREATE OR REPLACE TRIGGER update_technician_availability_updated_at
BEFORE UPDATE ON public.technician_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();