
-- Fix search_path for trigger functions that need it
-- This addresses the "Function Search Path Mutable" security warnings

-- 1. update_contractor_applications_updated_at
CREATE OR REPLACE FUNCTION public.update_contractor_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. update_image_slots_updated_at
CREATE OR REPLACE FUNCTION public.update_image_slots_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. update_permits_updated_at
CREATE OR REPLACE FUNCTION public.update_permits_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. update_warranty_updated_at
CREATE OR REPLACE FUNCTION public.update_warranty_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6. generate_claim_number
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  year_prefix TEXT;
  sequence_num INT;
  claim_num TEXT;
BEGIN
  year_prefix := 'W-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-';
  
  SELECT COALESCE(MAX(SUBSTRING(claim_number FROM 9)::INT), 0) + 1
  INTO sequence_num
  FROM public.warranty_claims
  WHERE claim_number LIKE year_prefix || '%';
  
  claim_num := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  RETURN claim_num;
END;
$function$;
