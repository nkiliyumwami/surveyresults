-- ============================================================
-- Migration: Student profile activation flag
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'is_profile_active'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN is_profile_active boolean NOT NULL DEFAULT false;
  END IF;
END $$;
