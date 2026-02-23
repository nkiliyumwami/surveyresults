-- ============================================================
-- Migration: Fix Over-Assignments (Cap Enforcement)
-- Purpose:
--   For every trainer with more than 10 active assignments,
--   keep the 10 oldest (by created_at) and re-assign the
--   overflow to peter.niyodusenga@microrisk.io.
-- ============================================================

DO $$
DECLARE
  v_peter_id uuid;
  v_reassigned int := 0;
BEGIN
  -- 1) Look up Peter's trainer_profiles.id
  SELECT id INTO v_peter_id
  FROM public.trainer_profiles
  WHERE email = 'peter.niyodusenga@microrisk.io'
  LIMIT 1;

  IF v_peter_id IS NULL THEN
    RAISE EXCEPTION 'Catch-all trainer peter.niyodusenga@microrisk.io not found in trainer_profiles';
  END IF;

  -- 2) Re-assign overflow rows
  --    For each trainer (excluding Peter), rank active assignments by created_at.
  --    Anything ranked > 10 gets moved to Peter.
  WITH ranked AS (
    SELECT
      a.id            AS assignment_id,
      a.trainer_id,
      a.student_id,
      ROW_NUMBER() OVER (
        PARTITION BY a.trainer_id
        ORDER BY a.created_at ASC
      ) AS rn
    FROM public.assignments a
    WHERE a.status = 'active'
      AND a.trainer_id IS DISTINCT FROM v_peter_id
  ),
  overflow AS (
    SELECT assignment_id, student_id
    FROM ranked
    WHERE rn > 10
  )
  UPDATE public.assignments a
  SET trainer_id = v_peter_id
  FROM overflow o
  WHERE a.id = o.assignment_id
    -- Skip if this student is already assigned to Peter (unique constraint)
    AND NOT EXISTS (
      SELECT 1 FROM public.assignments dup
      WHERE dup.student_id = o.student_id
        AND dup.trainer_id = v_peter_id
        AND dup.status = 'active'
    );

  GET DIAGNOSTICS v_reassigned = ROW_COUNT;
  RAISE NOTICE 'Reassigned % overflow assignments to Peter', v_reassigned;
END;
$$;
