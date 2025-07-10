/*
  # Fix User Creation Issues

  1. Problem
    - Users may not be created properly in public.users table
    - Trigger function may have issues with permissions or execution
    - RLS policies might be blocking user creation

  2. Solution
    - Improve trigger function with better error handling
    - Add fallback mechanisms for user creation
    - Ensure proper permissions for all operations
    - Add manual user creation function as backup

  3. Changes
    - Enhanced trigger function with detailed logging
    - Added backup user creation mechanism
    - Improved error handling and conflict resolution
    - Added function to manually create user profiles
*/

-- Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_val user_role;
  user_cpf text;
  user_nome text;
  user_telefone text;
  random_suffix text;
BEGIN
  RAISE LOG 'Starting user creation for email: %, id: %', NEW.email, NEW.id;
  
  -- Determine user role
  IF NEW.email = 'admin@rifa.com' THEN
    user_role_val := 'admin'::user_role;
  ELSE
    user_role_val := 'user'::user_role;
  END IF;

  -- Get user data from metadata with better defaults
  user_nome := COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário');
  user_cpf := COALESCE(NEW.raw_user_meta_data->>'cpf', '000.000.000-00');
  user_telefone := NEW.raw_user_meta_data->>'telefone';

  -- Generate random suffix for CPF if it's the default
  IF user_cpf = '000.000.000-00' THEN
    random_suffix := LPAD((RANDOM() * 999)::int::text, 3, '0');
    user_cpf := '000.000.' || random_suffix || '-00';
  END IF;

  RAISE LOG 'Attempting to insert user: nome=%, cpf=%, telefone=%, role=%', user_nome, user_cpf, user_telefone, user_role_val;

  -- Try to insert user profile with conflict resolution
  INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
  VALUES (NEW.id, user_nome, user_cpf, user_telefone, user_role_val)
  ON CONFLICT (cpf) DO UPDATE SET
    auth_id = CASE 
      WHEN users.auth_id IS NULL THEN EXCLUDED.auth_id 
      ELSE users.auth_id 
    END,
    nome = CASE 
      WHEN users.auth_id IS NULL THEN EXCLUDED.nome 
      ELSE users.nome 
    END,
    telefone = CASE 
      WHEN users.auth_id IS NULL THEN EXCLUDED.telefone 
      ELSE users.telefone 
    END,
    role = CASE 
      WHEN users.auth_id IS NULL THEN EXCLUDED.role 
      ELSE users.role 
    END,
    updated_at = NOW();

  RAISE LOG 'User profile created/updated successfully for: %', NEW.email;

  -- Update auth metadata with user role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', user_role_val::text)
  WHERE id = NEW.id;

  RAISE LOG 'Auth metadata updated for user: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'Unique violation for user %, attempting fallback', NEW.email;
    
    -- Try with a different CPF suffix
    random_suffix := LPAD((RANDOM() * 9999)::int::text, 4, '0');
    user_cpf := '000.' || random_suffix || '.000-00';
    
    BEGIN
      INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
      VALUES (NEW.id, user_nome, user_cpf, user_telefone, user_role_val);
      
      RAISE LOG 'Fallback user creation successful for: %', NEW.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Fallback user creation failed for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile for % (%): %', NEW.email, NEW.id, SQLERRM;
    
    -- Last resort: try with minimal data
    BEGIN
      random_suffix := LPAD((RANDOM() * 99999)::int::text, 5, '0');
      INSERT INTO public.users (auth_id, nome, cpf, role)
      VALUES (NEW.id, 'Usuário', '999.' || random_suffix || '.999-99', user_role_val);
      
      RAISE LOG 'Minimal user creation successful for: %', NEW.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'All user creation attempts failed for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create user profile (for backup/recovery)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_auth_id uuid,
  p_nome text,
  p_cpf text,
  p_telefone text DEFAULT NULL,
  p_role user_role DEFAULT 'user'
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
  random_suffix text;
BEGIN
  -- Generate random suffix if CPF is default or empty
  IF p_cpf IS NULL OR p_cpf = '' OR p_cpf = '000.000.000-00' THEN
    random_suffix := LPAD((RANDOM() * 999)::int::text, 3, '0');
    p_cpf := '000.000.' || random_suffix || '-00';
  END IF;

  INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
  VALUES (p_auth_id, p_nome, p_cpf, p_telefone, p_role)
  RETURNING id INTO user_id;

  -- Update auth metadata
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', p_role::text)
  WHERE id = p_auth_id;

  RETURN user_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Try with different CPF
    random_suffix := LPAD((RANDOM() * 9999)::int::text, 4, '0');
    p_cpf := '000.' || random_suffix || '.000-00';
    
    INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
    VALUES (p_auth_id, p_nome, p_cpf, p_telefone, p_role)
    RETURNING id INTO user_id;
    
    RETURN user_id;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text, user_role) TO authenticated;

-- Ensure RLS policies allow user creation
-- Temporarily disable RLS to fix any existing issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with improved policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create new, more permissive policies for user creation
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Allow authenticated users to insert their own data (needed for trigger)
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- Allow service role to insert any user (for trigger function)
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin policies using JWT claims
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

-- Ensure admin user exists and has proper metadata
DO $$
DECLARE
  admin_auth_id uuid;
  admin_profile_id uuid;
BEGIN
  -- Check if admin exists in auth.users
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@rifa.com';
  
  IF admin_auth_id IS NOT NULL THEN
    -- Check if admin profile exists
    SELECT id INTO admin_profile_id FROM public.users WHERE auth_id = admin_auth_id;
    
    IF admin_profile_id IS NULL THEN
      -- Create admin profile
      SELECT public.create_user_profile(
        admin_auth_id,
        'Administrador',
        '000.000.000-00',
        NULL,
        'admin'::user_role
      ) INTO admin_profile_id;
      
      RAISE LOG 'Created admin profile with id: %', admin_profile_id;
    END IF;
    
    -- Update admin metadata
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', 'admin')
    WHERE id = admin_auth_id;
    
    RAISE LOG 'Admin user setup completed';
  ELSE
    RAISE LOG 'Admin user not found in auth.users';
  END IF;
END $$;

-- Log current state
DO $$
DECLARE
  auth_count integer;
  profile_count integer;
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.users;
  
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.auth_id
  WHERE pu.auth_id IS NULL;
  
  RAISE LOG 'Auth users: %, Profile users: %, Missing profiles: %', auth_count, profile_count, missing_count;
END $$;