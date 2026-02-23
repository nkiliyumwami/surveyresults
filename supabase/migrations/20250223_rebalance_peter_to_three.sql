-- ============================================================
-- Migration: Rebalance 30 students from Peter to 3 trainers
-- Purpose:
--   Move the 30 newest active assignments from Peter to:
--     1. Alfred Ntaganda  (njesus05@gmail.com)         — 10 students
--     2. Justin Kaneza    (kyanscott96@gmail.com)       — 10 students
--     3. Bbaale Ismael    (ismaelbbaale@gmail.com)      — 10 students
--   Also ensure each target trainer has max_capacity = 10.
-- ============================================================

DO $$
DECLARE
  v_peter_id   uuid;
  v_alfred_id  uuid;
  v_justin_id  uuid;
  v_bbaale_id  uuid;
  v_moved      int := 0;
BEGIN
  -- ── Look up all four trainer IDs ──
  SELECT id INTO v_peter_id
    FROM public.trainer_profiles
   WHERE email = 'peter.niyodusenga@microrisk.io';

  SELECT id INTO v_alfred_id
    FROM public.trainer_profiles
   WHERE email = 'njesus05@gmail.com';

  SELECT id INTO v_justin_id
    FROM public.trainer_profiles
   WHERE email = 'kyanscott96@gmail.com';

  SELECT id INTO v_bbaale_id
    FROM public.trainer_profiles
   WHERE email = 'ismaelbbaale@gmail.com';

  -- Sanity checks
  IF v_peter_id  IS NULL THEN RAISE EXCEPTION 'Peter not found';  END IF;
  IF v_alfred_id IS NULL THEN RAISE EXCEPTION 'Alfred (njesus05@gmail.com) not found'; END IF;
  IF v_justin_id IS NULL THEN RAISE EXCEPTION 'Justin (kyanscott96@gmail.com) not found'; END IF;
  IF v_bbaale_id IS NULL THEN RAISE EXCEPTION 'Bbaale (ismaelbbaale@gmail.com) not found'; END IF;

  -- ── Ensure target trainers have correct capacity ──
  UPDATE public.trainer_profiles
     SET max_capacity = 10, max_students = 10
   WHERE id IN (v_alfred_id, v_justin_id, v_bbaale_id);

  -- ── Rank Peter's active assignments newest-first ──
  -- Rows 1-10  → Alfred
  -- Rows 11-20 → Justin
  -- Rows 21-30 → Bbaale

  WITH ranked AS (
    SELECT
      a.id AS assignment_id,
      ROW_NUMBER() OVER (ORDER BY a.created_at DESC) AS rn
    FROM public.assignments a
    WHERE a.trainer_id = v_peter_id
      AND a.status = 'active'
    LIMIT 30
  )
  UPDATE public.assignments a
  SET trainer_id = CASE
    WHEN r.rn BETWEEN  1 AND 10 THEN v_alfred_id
    WHEN r.rn BETWEEN 11 AND 20 THEN v_justin_id
    WHEN r.rn BETWEEN 21 AND 30 THEN v_bbaale_id
  END
  FROM ranked r
  WHERE a.id = r.assignment_id;

  GET DIAGNOSTICS v_moved = ROW_COUNT;
  RAISE NOTICE 'Moved % assignments from Peter to Alfred/Justin/Bbaale', v_moved;
END;
$$;
