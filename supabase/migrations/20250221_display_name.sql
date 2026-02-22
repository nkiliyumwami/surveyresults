-- ============================================================
-- Migration: Admin Name Override (display_name)
-- Purpose: Allow admins to set a corrected display name
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.students ADD COLUMN display_name text;
  END IF;
END $$;
