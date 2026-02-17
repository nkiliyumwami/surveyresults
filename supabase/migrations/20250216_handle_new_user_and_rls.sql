-- ============================================================
-- Migration: handle_new_user trigger + RLS policies
-- Purpose:
--   1. Automatically create a trainer_profiles row when a new
--      user confirms their email (via auth trigger).
--   2. Add RLS policies so that:
--      - Authenticated users can read their own profile
--      - Authenticated users can insert their own profile
--      - Admin users (those in trainer_roles with role = 'admin')
--        can read ALL profiles
-- ============================================================

-- 1) Create the trigger function (runs as SECURITY DEFINER so it
--    can insert into public.trainer_profiles regardless of RLS).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trainer_profiles (user_id, is_active)
  VALUES (NEW.id, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) Create the trigger on auth.users (fires after insert, i.e.
--    after a new user is created in Supabase Auth).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Enable RLS on trainer_profiles (idempotent).
ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;

-- 4) Policy: users can read their own profile.
DROP POLICY IF EXISTS "Users can view own profile" ON public.trainer_profiles;
CREATE POLICY "Users can view own profile"
  ON public.trainer_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5) Policy: users can insert their own profile.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.trainer_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.trainer_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6) Policy: users can update their own profile.
DROP POLICY IF EXISTS "Users can update own profile" ON public.trainer_profiles;
CREATE POLICY "Users can update own profile"
  ON public.trainer_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 7) Policy: admins can read ALL profiles.
--    An admin is any user who has a row in trainer_roles with role = 'admin'.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.trainer_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.trainer_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- 8) Policy: admins can update ALL profiles (e.g. toggle is_active).
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.trainer_profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.trainer_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- 9) Policy: admins can delete profiles.
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.trainer_profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.trainer_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles
      WHERE trainer_roles.user_id = auth.uid()
        AND trainer_roles.role = 'admin'
    )
  );

-- 10) Enable RLS on trainer_roles and add read policy for authenticated users.
ALTER TABLE public.trainer_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.trainer_roles;
CREATE POLICY "Authenticated users can view roles"
  ON public.trainer_roles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin can manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.trainer_roles;
CREATE POLICY "Admins can manage roles"
  ON public.trainer_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_roles AS tr
      WHERE tr.user_id = auth.uid()
        AND tr.role = 'admin'
    )
  );
