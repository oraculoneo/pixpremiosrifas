/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current admin policies query the users table within the policy itself
    - This creates infinite recursion when trying to access user data
    
  2. Solution
    - Drop existing problematic policies
    - Create new policies that don't cause recursion
    - Use a simpler approach for admin access using auth.jwt() claims
    - Keep user self-access policies as they work correctly

  3. Changes
    - Remove recursive admin policies
    - Add new admin policies using auth metadata
    - Maintain user self-access policies
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Create new admin policies that don't cause recursion
-- We'll use a different approach - check if the user has admin role in their auth metadata
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is reading their own data
    auth_id = auth.uid()
    OR
    -- Allow if user has admin role (we'll set this in auth metadata)
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL
  TO authenticated
  USING (
    -- Allow if user is managing their own data
    auth_id = auth.uid()
    OR
    -- Allow if user has admin role
    (auth.jwt() ->> 'user_role')::text = 'admin'
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    auth_id = auth.uid()
    OR
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

-- Update the trigger function to set user role in auth metadata when user role changes
CREATE OR REPLACE FUNCTION update_auth_user_metadata()
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
DROP TRIGGER IF EXISTS update_auth_metadata_on_role_change ON users;
CREATE TRIGGER update_auth_metadata_on_role_change
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_user_metadata();

-- Also update existing admin users' metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', u.role::text)
FROM users u 
WHERE auth.users.id = u.auth_id AND u.role = 'admin';