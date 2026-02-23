-- ============================================================
-- Migration: Fix "Nashvilletennesse" country data
-- One-time cleanup for historical records with misspelled country
-- ============================================================

UPDATE public.students
SET country = 'United States'
WHERE lower(trim(country)) IN (
  'nashvilletennesse',
  'nashvilletenesse',
  'nashivilletenesse',
  'nashivilletennessee',
  'nashivilletennesse',
  'nashvilletennessee'
);
