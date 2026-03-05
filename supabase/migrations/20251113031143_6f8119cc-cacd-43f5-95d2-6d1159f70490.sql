-- Create helper function to increment estimator assignments
CREATE OR REPLACE FUNCTION public.increment_estimator_assignments(estimator_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.estimators 
  SET current_assignments = current_assignments + 1
  WHERE user_id = estimator_user_id;
END;
$$;

-- Create helper function to decrement estimator assignments
CREATE OR REPLACE FUNCTION public.decrement_estimator_assignments(estimator_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.estimators 
  SET current_assignments = GREATEST(current_assignments - 1, 0)
  WHERE user_id = estimator_user_id;
END;
$$;