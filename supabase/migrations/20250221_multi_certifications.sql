-- ============================================================
-- Migration: Multi-Certification Support
-- Purpose:
--   1. Add student_certifications JSONB column for up to 4 certs
--   2. Migrate existing single-cert data into the new array format
-- ============================================================

-- 1) Add student_certifications JSONB column (array of {name, credly_url})
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'student_certifications'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN student_certifications jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2) Migrate existing single-cert data into the new array format
--    Only for rows that have a certification_name and an empty array
UPDATE public.students
SET student_certifications = jsonb_build_array(
  jsonb_build_object(
    'name', certification_name,
    'credly_url', COALESCE(credly_url, '')
  )
)
WHERE certification_name IS NOT NULL
  AND certification_name <> ''
  AND (student_certifications = '[]'::jsonb OR student_certifications IS NULL);
