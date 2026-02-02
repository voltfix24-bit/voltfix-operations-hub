-- Fix service_types RLS policy to allow anonymous users (non-logged in guests)
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view service types" ON public.service_types;

CREATE POLICY "Anyone can view service types" 
ON public.service_types 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Also ensure the jobs table allows anonymous INSERT for guest bookings
DROP POLICY IF EXISTS "Anyone can create jobs" ON public.jobs;

CREATE POLICY "Anyone can create jobs" 
ON public.jobs 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);