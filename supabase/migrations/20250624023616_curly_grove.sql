/*
  # Fix User Creation and Sync Existing Users

  1. Problem
    - Users created in auth.users are not automatically created in public.users
    - Trigger may not be working correctly
    - Need to sync existing auth users to public.users table

  2. Solution
    - Fix the trigger function to handle all edge cases
    - Sync existing auth.users to public.users
    - Ensure proper permissions and error handling
    - Add function to manually sync users if needed

  3. Changes
    - Improve trigger function with better error handling
    - Sync existing auth users to public.users
    - Add manual sync function for admins
    - Fix permissions and policies
*/

-- First, let's create a function to sync existing auth users to public.users
CREATE OR REPLACE FUNCTION public.sync_auth_users_to_public()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
  user_role_val user_role;
BEGIN
  -- Loop through all auth.users that don't have corresponding public.users entries
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.auth_id
    WHERE pu.auth_id IS NULL
  LOOP
    -- Determine user role
    IF auth_user.email = 'admin@rifa.com' THEN
      user_role_val := 'admin'::user_role;
    ELSE
      user_role_val := 'user'::user_role;
    END IF;

    -- Insert user into public.users
    INSERT INTO public.users (auth_id, nome, cpf, role, created_at)
    VALUES (
      auth_user.id,
      COALESCE(auth_user.raw_user_meta_data->>'nome', 'Usuário'),
      COALESCE(auth_user.raw_user_meta_data->>'cpf', '000.000.000-' || LPAD((RANDOM() * 99)::int::text, 2, '0')),
      user_role_val,
      auth_user.created_at
    )
    ON CONFLICT (cpf) DO UPDATE SET
      auth_id = EXCLUDED.auth_id,
      nome = EXCLUDED.nome,
      role = EXCLUDED.role,
      updated_at = NOW();

    -- Update auth metadata with user role
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', user_role_val::text)
    WHERE id = auth_user.id;

    RAISE LOG 'Synced user: % (%) with role: %', auth_user.email, auth_user.id, user_role_val;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improve the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_val user_role;
  user_cpf text;
  user_nome text;
BEGIN
  -- Determine user role
  IF NEW.email = 'admin@rifa.com' THEN
    user_role_val := 'admin'::user_role;
  ELSE
    user_role_val := 'user'::user_role;
  END IF;

  -- Get user data from metadata
  user_nome := COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário');
  user_cpf := COALESCE(NEW.raw_user_meta_data->>'cpf', '000.000.000-' || LPAD((RANDOM() * 99)::int::text, 2, '0'));

  -- Try to insert user profile
  INSERT INTO public.users (auth_id, nome, cpf, role)
  VALUES (NEW.id, user_nome, user_cpf, user_role_val)
  ON CONFLICT (cpf) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Update auth metadata with user role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', user_role_val::text)
  WHERE id = NEW.id;

  RAISE LOG 'Created user profile for: % (%) with role: %', NEW.email, NEW.id, user_role_val;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile for % (%): %', NEW.email, NEW.id, SQLERRM;
    
    -- Try a simpler insert without conflict resolution
    BEGIN
      INSERT INTO public.users (auth_id, nome, cpf, role)
      VALUES (NEW.id, user_nome, user_cpf || '-' || substr(NEW.id::text, 1, 4), user_role_val);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to create user profile even with fallback for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.sync_auth_users_to_public() TO authenticated;

-- Sync existing users
SELECT public.sync_auth_users_to_public();

-- Verify that all auth users now have corresponding public.users entries
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.auth_id
  WHERE pu.auth_id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE LOG 'Warning: % auth users still missing from public.users table', missing_count;
  ELSE
    RAISE LOG 'Success: All auth users are now synced to public.users table';
  END IF;
END $$;

-- Create a function that admins can call to manually sync users if needed
CREATE OR REPLACE FUNCTION public.manual_user_sync()
RETURNS TABLE(synced_users integer, total_auth_users integer) AS $$
DECLARE
  synced_count integer := 0;
  total_count integer := 0;
BEGIN
  -- Count total auth users
  SELECT COUNT(*) INTO total_count FROM auth.users;
  
  -- Sync users
  PERFORM public.sync_auth_users_to_public();
  
  -- Count how many users we have in public.users now
  SELECT COUNT(*) INTO synced_count FROM public.users;
  
  RETURN QUERY SELECT synced_count, total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to call manual sync function
GRANT EXECUTE ON FUNCTION public.manual_user_sync() TO authenticated;