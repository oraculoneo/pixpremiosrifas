/*
  # Adicionar campo telefone na tabela users

  1. Alterações
    - Adicionar coluna telefone na tabela users
    - Atualizar trigger para incluir telefone
    - Manter compatibilidade com dados existentes

  2. Segurança
    - Manter RLS existente
    - Telefone é opcional inicialmente
*/

-- Adicionar coluna telefone na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefone text;

-- Criar índice para telefone (opcional, para buscas futuras)
CREATE INDEX IF NOT EXISTS idx_users_telefone ON public.users(telefone);

-- Atualizar função de criação de usuário para incluir telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_val user_role;
  user_cpf text;
  user_nome text;
  user_telefone text;
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
  user_telefone := NEW.raw_user_meta_data->>'telefone';

  -- Try to insert user profile
  INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
  VALUES (NEW.id, user_nome, user_cpf, user_telefone, user_role_val)
  ON CONFLICT (cpf) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
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
      INSERT INTO public.users (auth_id, nome, cpf, telefone, role)
      VALUES (NEW.id, user_nome, user_cpf || '-' || substr(NEW.id::text, 1, 4), user_telefone, user_role_val);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to create user profile even with fallback for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de sincronização para incluir telefone
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
    INSERT INTO public.users (auth_id, nome, cpf, telefone, role, created_at)
    VALUES (
      auth_user.id,
      COALESCE(auth_user.raw_user_meta_data->>'nome', 'Usuário'),
      COALESCE(auth_user.raw_user_meta_data->>'cpf', '000.000.000-' || LPAD((RANDOM() * 99)::int::text, 2, '0')),
      auth_user.raw_user_meta_data->>'telefone',
      user_role_val,
      auth_user.created_at
    )
    ON CONFLICT (cpf) DO UPDATE SET
      auth_id = EXCLUDED.auth_id,
      nome = EXCLUDED.nome,
      telefone = EXCLUDED.telefone,
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