/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - Current admin policies query the users table within the policy itself
    - This creates infinite recursion when trying to access user data
    
  2. Solution
    - Drop existing problematic policies
    - Create new policies that don't cause recursion
    - Use auth.jwt() claims instead of querying users table
    - Simplify user access patterns

  3. Changes
    - Remove recursive admin policies
    - Add new admin policies using auth metadata
    - Maintain user self-access policies
    - Update trigger to set proper metadata
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- Admin policies using JWT claims (no recursion)
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR
    (auth.jwt() ->> 'user_role')::text = 'admin'
  )
  WITH CHECK (
    auth_id = auth.uid()
    OR
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

-- Update the trigger function to set user role in auth metadata
CREATE OR REPLACE FUNCTION public.update_auth_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's metadata in auth.users when role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', NEW.role::text)
    WHERE id = NEW.auth_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update auth metadata when user role changes
DROP TRIGGER IF EXISTS update_auth_metadata_on_role_change ON public.users;
CREATE TRIGGER update_auth_metadata_on_role_change
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auth_user_metadata();

-- Update existing admin users' metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', u.role::text)
FROM public.users u 
WHERE auth.users.id = u.auth_id AND u.role = 'admin';

-- Fix other tables' policies that might reference users table recursively
-- Drop and recreate policies for other tables to avoid recursion

-- Sorteios policies
DROP POLICY IF EXISTS "Admins can manage sorteios" ON public.sorteios;
CREATE POLICY "Admins can manage sorteios" ON public.sorteios
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- Premios policies  
DROP POLICY IF EXISTS "Admins can manage premios" ON public.premios;
CREATE POLICY "Admins can manage premios" ON public.premios
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- Comprovantes policies
DROP POLICY IF EXISTS "Admins can manage all comprovantes" ON public.comprovantes;
CREATE POLICY "Admins can manage all comprovantes" ON public.comprovantes
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- Numeros rifa policies
DROP POLICY IF EXISTS "Admins can manage all numbers" ON public.numeros_rifa;
CREATE POLICY "Admins can manage all numbers" ON public.numeros_rifa
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- Cupons policies
DROP POLICY IF EXISTS "Admins can manage cupons" ON public.cupons;
CREATE POLICY "Admins can manage cupons" ON public.cupons
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- System config policies
DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;
CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role')::text = 'admin');

-- Ensure admin user has proper metadata
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT auth_id INTO admin_user_id FROM public.users WHERE role = 'admin' LIMIT 1;
  
  -- Update admin user metadata if found
  IF admin_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', 'admin')
    WHERE id = admin_user_id;
  END IF;
END $$;