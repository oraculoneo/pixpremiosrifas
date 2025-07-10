/*
  # Fix Supabase Auth Integration

  1. Create admin user in auth.users table
  2. Update trigger function for better error handling
  3. Set up proper permissions and policies
  4. Ensure RLS policies work correctly for registration

  Note: Email confirmation is disabled at the project level in Supabase dashboard
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@rifa.com';
  
  -- If admin doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert admin user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@rifa.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Administrador","cpf":"000.000.000-00"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Create corresponding user profile
    INSERT INTO public.users (auth_id, nome, cpf, role)
    VALUES (
      admin_user_id,
      'Administrador',
      '000.000.000-00',
      'admin'::user_role
    );
  END IF;
END $$;

-- Ensure the trigger function handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Try to insert user profile
  INSERT INTO public.users (auth_id, nome, cpf, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '000.000.000-00'),
    CASE 
      WHEN NEW.email = 'admin@rifa.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If user already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for auth operations
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT SELECT ON public.system_config TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Update RLS policies for better registration flow
-- Allow authenticated users to insert their own data
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- Allow users to read their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

-- Allow users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Allow admins to read all users
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow anyone to read system config (needed for registration page)
DROP POLICY IF EXISTS "Anyone can read system config" ON public.system_config;
CREATE POLICY "Anyone can read system config" ON public.system_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow admins to manage system config
DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;
CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default system configuration if not exists
INSERT INTO public.system_config (key, value) VALUES
  ('system_name', '"Sistema de Rifas"'),
  ('min_deposit_amount', '100'),
  ('block_value', '100'),
  ('numbers_per_block', '10'),
  ('ai_validation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;