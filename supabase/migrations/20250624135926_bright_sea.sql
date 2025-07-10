/*
  # Create user profile function and trigger

  1. New Functions
    - `create_user_profile` - RPC function to manually create user profiles
    - `handle_new_user` - Trigger function to automatically create profiles on auth signup

  2. New Triggers
    - Automatically create user profile when new auth user is created

  3. Security
    - RLS policies already exist for users table
    - Functions use security definer for proper permissions
*/

-- Create the RPC function to manually create user profiles
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_id uuid,
  p_nome text,
  p_cpf text,
  p_telefone text DEFAULT NULL,
  p_role user_role DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the new user profile
  INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
  VALUES (p_auth_id, p_nome, p_cpf, p_telefone, p_role)
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
EXCEPTION
  WHEN unique_violation THEN
    -- If user already exists, return existing user id
    SELECT id INTO new_user_id
    FROM public.users
    WHERE auth_id = p_auth_id;
    
    RETURN new_user_id;
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Error creating user profile: %', SQLERRM;
END;
$$;

-- Create trigger function to handle new user signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_nome text;
  user_cpf text;
  user_telefone text;
  user_role user_role;
BEGIN
  -- Extract user metadata
  user_nome := COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário');
  user_cpf := COALESCE(NEW.raw_user_meta_data->>'cpf', '');
  user_telefone := NEW.raw_user_meta_data->>'telefone';
  
  -- Set role based on email (admin for specific email)
  IF NEW.email = 'admin@rifa.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;

  -- Create user profile
  INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
  VALUES (NEW.id, user_nome, user_cpf, user_telefone, user_role);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;