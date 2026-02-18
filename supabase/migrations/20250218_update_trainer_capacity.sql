-- ============================================================
-- Migration: Update Trainer Capacity Default
-- Purpose: Increase default max_capacity from 10 to 25 students per trainer
-- ============================================================

-- 1) Update the default value for max_capacity column
ALTER TABLE public.trainer_profiles
ALTER COLUMN max_capacity SET DEFAULT 25;

-- 2) Update the default value for max_students column (legacy field)
ALTER TABLE public.trainer_profiles
ALTER COLUMN max_students SET DEFAULT 25;

-- 3) Update existing trainers who still have the old default of 10
-- Only update if they haven't customized their capacity
UPDATE public.trainer_profiles
SET max_capacity = 25
WHERE max_capacity = 10 OR max_capacity IS NULL;

UPDATE public.trainer_profiles
SET max_students = 25
WHERE max_students = 10 OR max_students IS NULL;
