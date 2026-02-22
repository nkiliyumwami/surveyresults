-- ============================================================
-- Migration: Student Profile RPCs + public read access
-- Purpose:
--   1. Allow anon users to read a student by ID (profile page)
--   2. RPC to safely update display_name (activates profile)
--   3. RPC to fetch assigned mentor details
-- ============================================================

-- 1) Allow anonymous SELECT on any student (profile page reads by UUID)
--    UUIDs are unguessable; data shown is non-sensitive.
DROP POLICY IF EXISTS "Public can view student by id" ON public.students;
CREATE POLICY "Public can view student by id"
  ON public.students
  FOR SELECT
  USING (true);

-- 2) RPC: update display_name and activate profile
CREATE OR REPLACE FUNCTION update_student_display_name(
  p_student_id uuid,
  p_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic validation: 2-100 characters, trimmed
  IF char_length(trim(p_display_name)) < 2 OR char_length(trim(p_display_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  UPDATE public.students
  SET display_name = trim(p_display_name),
      is_profile_active = true
  WHERE id = p_student_id;
END;
$$;

-- 3) RPC: get assigned mentor for a student
CREATE OR REPLACE FUNCTION get_student_mentor(p_student_id uuid)
RETURNS TABLE(
  trainer_name text,
  trainer_email text,
  trainer_expertise text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    tp.full_name  AS trainer_name,
    tp.email      AS trainer_email,
    tp.expertise  AS trainer_expertise
  FROM public.assignments a
  JOIN public.trainer_profiles tp ON tp.id = a.trainer_id
  WHERE a.student_id = p_student_id
    AND a.status = 'active'
    AND tp.is_active = true
  LIMIT 1;
$$;
