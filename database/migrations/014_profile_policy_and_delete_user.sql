-- Migration: Fix profiles insert policy and harden delete_user search_path
-- Date: 2026-02-07

-- Fix unsafe INSERT policy on profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Harden delete_user (any signature) search_path
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'delete_user'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;
