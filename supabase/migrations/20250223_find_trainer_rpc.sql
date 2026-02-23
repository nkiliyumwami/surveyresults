-- ============================================================
-- Migration: Find-Your-Trainer RPC + trainer_profiles read access
-- Purpose:
--   1. Allow anon/auth SELECT on trainer_profiles (needed for
--      trainer count on landing page and general lookups)
--   2. RPC to safely look up a student's assigned trainer by email
--      (SECURITY DEFINER — bypasses RLS, returns limited data)
-- ============================================================

-- 1) Allow public read access to trainer_profiles
--    The landing page needs to count active trainers, and the
--    "Find Your Trainer" feature needs trainer name/email.
DROP POLICY IF EXISTS "Public can view trainer profiles" ON public.trainer_profiles;
CREATE POLICY "Public can view trainer profiles"
  ON public.trainer_profiles
  FOR SELECT
  USING (true);

-- 2) RPC: get_trainer_by_student_email
--    Takes a student email, finds their active assignment,
--    and returns the trainer's name + email.
--    Returns a single row with a status field so the frontend
--    can distinguish "no student" from "no assignment".
CREATE OR REPLACE FUNCTION get_trainer_by_student_email(email_input text)
RETURNS TABLE(
  status text,
  student_name text,
  trainer_name text,
  trainer_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_student_id   uuid;
  v_student_name text;
  v_trainer_name text;
  v_trainer_email text;
BEGIN
  -- Look up the student
  SELECT s.id,
         COALESCE(s.display_name, s.full_name, email_input)
    INTO v_student_id, v_student_name
    FROM public.students s
   WHERE lower(s.email) = lower(trim(email_input))
   LIMIT 1;

  IF v_student_id IS NULL THEN
    RETURN QUERY SELECT
      'no_student'::text,
      NULL::text,
      NULL::text,
      NULL::text;
    RETURN;
  END IF;

  -- Look up active assignment + trainer
  SELECT tp.full_name, tp.email
    INTO v_trainer_name, v_trainer_email
    FROM public.assignments a
    JOIN public.trainer_profiles tp ON tp.id = a.trainer_id
   WHERE a.student_id = v_student_id
     AND a.status = 'active'
     AND tp.is_active = true
   LIMIT 1;

  IF v_trainer_name IS NULL THEN
    RETURN QUERY SELECT
      'no_assignment'::text,
      v_student_name,
      NULL::text,
      NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    'found'::text,
    v_student_name,
    v_trainer_name,
    v_trainer_email;
END;
$$;
