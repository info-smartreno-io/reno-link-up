-- Create estimators table with service areas and specializations
CREATE TABLE IF NOT EXISTS public.estimators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_assignments INTEGER NOT NULL DEFAULT 0,
  max_assignments INTEGER NOT NULL DEFAULT 10,
  service_zip_codes TEXT[] NOT NULL DEFAULT '{}',
  specializations TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.estimators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Estimators can view their own profile"
  ON public.estimators
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Estimators can update their own profile"
  ON public.estimators
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all estimators"
  ON public.estimators
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_estimators_user_id ON public.estimators(user_id);
CREATE INDEX idx_estimators_active ON public.estimators(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_estimators_updated_at
  BEFORE UPDATE ON public.estimators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-assign lead to best available estimator
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_estimator_id UUID;
  lead_zip TEXT;
BEGIN
  -- Only auto-assign new leads that aren't already assigned
  IF NEW.status = 'new_lead' AND NEW.user_id IS NULL THEN
    -- Extract zip code from location (assuming format like "City, STATE ZIP")
    lead_zip := TRIM(SPLIT_PART(NEW.location, ' ', -1));
    
    -- Find best estimator based on:
    -- 1. Active status
    -- 2. Has capacity (current_assignments < max_assignments)
    -- 3. Services the zip code area (if zip codes are set)
    -- 4. Has matching specialization (if specializations are set)
    -- 5. Lowest current workload
    SELECT e.user_id INTO selected_estimator_id
    FROM public.estimators e
    WHERE e.is_active = true
      AND e.current_assignments < e.max_assignments
      AND (
        -- Either no zip codes set (services all areas) or zip matches
        CARDINALITY(e.service_zip_codes) = 0 
        OR lead_zip = ANY(e.service_zip_codes)
      )
      AND (
        -- Either no specializations set (handles all types) or project type matches
        CARDINALITY(e.specializations) = 0 
        OR NEW.project_type = ANY(e.specializations)
      )
    ORDER BY e.current_assignments ASC, e.created_at ASC
    LIMIT 1;
    
    -- If an estimator was found, assign the lead
    IF selected_estimator_id IS NOT NULL THEN
      NEW.user_id := selected_estimator_id;
      
      -- Increment the estimator's assignment count
      UPDATE public.estimators
      SET current_assignments = current_assignments + 1
      WHERE user_id = selected_estimator_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign leads on insert
CREATE TRIGGER trigger_auto_assign_lead
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_lead();

-- Trigger to update assignment count when lead is reassigned
CREATE OR REPLACE FUNCTION public.update_estimator_assignment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id changed (reassignment)
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    -- Decrement old estimator's count
    IF OLD.user_id IS NOT NULL THEN
      UPDATE public.estimators
      SET current_assignments = GREATEST(current_assignments - 1, 0)
      WHERE user_id = OLD.user_id;
    END IF;
    
    -- Increment new estimator's count
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.estimators
      SET current_assignments = current_assignments + 1
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_estimator_counts
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
  EXECUTE FUNCTION public.update_estimator_assignment_count();