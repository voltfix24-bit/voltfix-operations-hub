-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'technician', 'admin');

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('requested', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled');

-- Create enum for job urgency
CREATE TYPE public.job_urgency AS ENUM ('emergency', 'planned');

-- Create enum for time slots
CREATE TYPE public.time_slot AS ENUM ('morning', 'afternoon', 'evening', 'night');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  preferred_time_slot time_slot,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create technicians table
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_available BOOLEAN NOT NULL DEFAULT true,
  skill_tags TEXT[] DEFAULT '{}',
  max_daily_jobs INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_types table
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_nl TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  is_emergency_eligible BOOLEAN NOT NULL DEFAULT false,
  skill_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_rules table
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
  flat_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  applies_to_emergency BOOLEAN NOT NULL DEFAULT false,
  applies_to_planned BOOLEAN NOT NULL DEFAULT false,
  time_slot time_slot,
  is_weekend BOOLEAN,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id),
  status job_status NOT NULL DEFAULT 'requested',
  urgency job_urgency NOT NULL DEFAULT 'planned',
  scheduled_date DATE,
  scheduled_time_slot time_slot,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  description TEXT,
  customer_notes TEXT,
  technician_notes TEXT,
  photos TEXT[] DEFAULT '{}',
  base_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  price_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_notes table for CRM
CREATE TABLE public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view customer profiles for their jobs"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'technician'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Technicians policies
CREATE POLICY "Technicians can view and update their own record"
ON public.technicians FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all technicians"
ON public.technicians FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view available technicians"
ON public.technicians FOR SELECT
USING (is_available = true);

-- Service types policies (public read)
CREATE POLICY "Anyone can view service types"
ON public.service_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage service types"
ON public.service_types FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Pricing rules policies (public read for authenticated)
CREATE POLICY "Authenticated users can view active pricing rules"
ON public.pricing_rules FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage pricing rules"
ON public.pricing_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Jobs policies
CREATE POLICY "Customers can view their own jobs"
ON public.jobs FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create jobs"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Technicians can view their assigned jobs"
ON public.jobs FOR SELECT
USING (
  technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Technicians can update their assigned jobs"
ON public.jobs FOR UPDATE
USING (
  technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all jobs"
ON public.jobs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Invoices policies
CREATE POLICY "Customers can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Customer notes policies
CREATE POLICY "Admins can manage customer notes"
ON public.customer_notes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default service types
INSERT INTO public.service_types (name, name_nl, description, base_price, is_emergency_eligible, skill_required) VALUES
('Power Outage', 'Stroomstoring', 'Complete or partial power outage in building', 125.00, true, 'emergency'),
('Short Circuit', 'Kortsluiting', 'Short circuit diagnosis and repair', 125.00, true, 'emergency'),
('Burning Smell', 'Brandlucht', 'Investigation of electrical burning smell', 150.00, true, 'emergency'),
('Water in Fuse Box', 'Water in meterkast', 'Water damage in electrical panel', 175.00, true, 'emergency'),
('Fuse Box Inspection', 'Meterkast keuring', 'Complete electrical panel inspection', 95.00, false, 'inspection'),
('EV Charger Installation', 'Laadpaal installatie', 'Electric vehicle charger installation', 250.00, false, 'ev'),
('Outlet Installation', 'Stopcontact plaatsen', 'New outlet installation', 85.00, false, 'general'),
('Lighting Installation', 'Verlichting installatie', 'Light fixture installation', 75.00, false, 'general'),
('General Inspection', 'Algemene keuring', 'General electrical safety inspection', 125.00, false, 'inspection');

-- Insert default pricing rules
INSERT INTO public.pricing_rules (name, description, multiplier, flat_fee, applies_to_emergency, applies_to_planned, time_slot, is_weekend) VALUES
('Emergency Base', 'Emergency service base fee', 1.5, 25.00, true, false, NULL, NULL),
('Evening Rate', 'Evening hours surcharge (18:00-22:00)', 1.25, 0.00, true, true, 'evening', NULL),
('Night Rate', 'Night hours surcharge (22:00-06:00)', 1.75, 50.00, true, false, 'night', NULL),
('Weekend Rate', 'Weekend surcharge', 1.35, 15.00, true, true, NULL, true),
('Planned Discount', 'Discount for planned appointments', 0.9, 0.00, false, true, NULL, NULL);