-- ============================================================
-- Migration: Student-Trainer Matching Data Infrastructure
-- Purpose:
--   1. Create students table to track students for matching
--   2. Create assignments table to link students with trainers
--   3. Audit trainer_profiles for max_capacity and specializations
--   4. Set up appropriate RLS policies
-- ============================================================

-- 1) Create students table
-- Note: Students originally come from Google Sheets survey, but we store
-- matched students here for relationship tracking
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  country text,
  journey_level text,        -- e.g., "Absolute Beginner", "IT Professional", etc.
  target_role text,          -- e.g., "Offensive", "Defensive", "Governance"
  roadblock text,            -- What's blocking their progress
  weekly_hours text,         -- Time commitment
  certifications text,       -- Certs they're pursuing
  survey_timestamp text,     -- Original survey submission time
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Create assignments table for student-trainer matching
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes text,                -- Optional notes about the assignment
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Prevent duplicate active assignments for the same student-trainer pair
  UNIQUE (student_id, trainer_id)
);

-- 3) Audit trainer_profiles: Add max_capacity if it doesn't exist
-- Note: The table already has max_students, but adding max_capacity for clarity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trainer_profiles'
    AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE public.trainer_profiles
    ADD COLUMN max_capacity integer DEFAULT 10;
  END IF;
END $$;

-- 4) Audit trainer_profiles: Add specializations if it doesn't exist
-- Note: The table already has expertise (text[]), but adding specializations for specificity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trainer_profiles'
    AND column_name = 'specializations'
  ) THEN
    ALTER TABLE public.trainer_profiles
    ADD COLUMN specializations text[] DEFAULT '{}';
  END IF;
END $$;

-- 5) Enable RLS on new tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies for students table

-- Admins can view all students
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
CREATE POLICY "Admins can view all students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- Admins can insert students
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
CREATE POLICY "Admins can insert students"
  ON public.students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- Admins can update students
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
CREATE POLICY "Admins can update students"
  ON public.students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- Admins can delete students
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
CREATE POLICY "Admins can delete students"
  ON public.students
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- Trainers can view their assigned students
DROP POLICY IF EXISTS "Trainers can view assigned students" ON public.students;
CREATE POLICY "Trainers can view assigned students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.trainer_profiles tp ON tp.id = a.trainer_id
      WHERE a.student_id = students.id
        AND tp.user_id = auth.uid()
    )
  );

-- 7) RLS Policies for assignments table

-- Admins can do everything with assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments"
  ON public.assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- Trainers can view their own assignments
DROP POLICY IF EXISTS "Trainers can view own assignments" ON public.assignments;
CREATE POLICY "Trainers can view own assignments"
  ON public.assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_profiles tp
      WHERE tp.id = assignments.trainer_id
        AND tp.user_id = auth.uid()
    )
  );

-- Trainers can update their own assignments (e.g., mark as completed)
DROP POLICY IF EXISTS "Trainers can update own assignments" ON public.assignments;
CREATE POLICY "Trainers can update own assignments"
  ON public.assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_profiles tp
      WHERE tp.id = assignments.trainer_id
        AND tp.user_id = auth.uid()
    )
  );

-- 8) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON public.assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_trainer_id ON public.assignments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- 9) Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10) Apply updated_at triggers
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
