-- ============================================================
-- Migration: Certified Corner Feature
-- Purpose:
--   1. Add certification fields to students table
--   2. Add featured flag for Certified Corner gallery
--   3. Add RLS policy for public viewing of featured students
--   4. Add partial index for performance
-- ============================================================

-- 1) Add certification_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'certification_name'
  ) THEN
    ALTER TABLE public.students ADD COLUMN certification_name text;
  END IF;
END $$;

-- 2) Add certification_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'certification_date'
  ) THEN
    ALTER TABLE public.students ADD COLUMN certification_date date;
  END IF;
END $$;

-- 3) Add credly_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'credly_url'
  ) THEN
    ALTER TABLE public.students ADD COLUMN credly_url text;
  END IF;
END $$;

-- 4) Add profile_image_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE public.students ADD COLUMN profile_image_url text;
  END IF;
END $$;

-- 5) Add featured_in_certified_corner column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'featured_in_certified_corner'
  ) THEN
    ALTER TABLE public.students ADD COLUMN featured_in_certified_corner boolean DEFAULT false;
  END IF;
END $$;

-- 6) RLS policy: Allow anonymous/public SELECT for featured certified students
DROP POLICY IF EXISTS "Public can view featured certified students" ON public.students;
CREATE POLICY "Public can view featured certified students"
  ON public.students
  FOR SELECT
  USING (featured_in_certified_corner = true);

-- 7) Partial index for querying featured students efficiently
CREATE INDEX IF NOT EXISTS idx_students_featured_certified
  ON public.students(featured_in_certified_corner)
  WHERE featured_in_certified_corner = true;
