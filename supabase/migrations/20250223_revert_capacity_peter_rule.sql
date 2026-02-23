-- ============================================================
-- Migration: Revert Trainer Capacity & The Peter Rule
-- Purpose:
--   1. Revert default max_capacity / max_students from 25 back to 10
--   2. Reset all existing trainers to 10 EXCEPT peter.niyodusenga
--   3. Set Peter's capacity to 999 (catch-all safety net)
-- ============================================================

-- 1) Revert column defaults to 10
ALTER TABLE public.trainer_profiles
ALTER COLUMN max_capacity SET DEFAULT 10;

ALTER TABLE public.trainer_profiles
ALTER COLUMN max_students SET DEFAULT 10;

-- 2) Reset all trainers back to 10 (except Peter)
UPDATE public.trainer_profiles
SET max_capacity = 10, max_students = 10
WHERE email IS DISTINCT FROM 'peter.niyodusenga@microrisk.io';

-- 3) Set Peter's capacity to 999 (catch-all trainer)
UPDATE public.trainer_profiles
SET max_capacity = 999, max_students = 999
WHERE email = 'peter.niyodusenga@microrisk.io';
