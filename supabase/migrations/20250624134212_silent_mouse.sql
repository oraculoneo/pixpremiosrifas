/*
  # Adicionar novo administrador ao sistema

  1. Problema
    - CPF 000.000.001-00 já existe no sistema
    - Precisa usar um CPF único para o novo admin

  2. Solução
    - Verificar se o usuário já existe antes de criar
    - Usar CPF único para evitar conflitos
    - Atualizar dados se o usuário já existir

  3. Mudanças
    - Criar novo admin com CPF único
    - Verificar existência antes de inserir
    - Tratar conflitos de CPF adequadamente
*/

-- Adicionar novo administrador
DO $$
DECLARE
  new_admin_id uuid;
  admin_auth_exists boolean := false;
  admin_profile_exists boolean := false;
  unique_cpf text;
  counter integer := 1;
BEGIN
  -- Verificar se o admin já existe na tabela auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'suportefaturebet@gmail.com') INTO admin_auth_exists;
  
  -- Verificar se já existe um perfil com esse nome
  SELECT EXISTS(SELECT 1 FROM public.users WHERE nome = 'Suporte FatureBet') INTO admin_profile_exists;
  
  -- Se o usuário de auth não existe, criar tudo do zero
  IF NOT admin_auth_exists THEN
    -- Gerar UUID para o novo admin
    new_admin_id := gen_random_uuid();
    
    -- Encontrar um CPF único
    LOOP
      unique_cpf := '000.000.00' || counter::text || '-00';
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.users WHERE cpf = unique_cpf);
      counter := counter + 1;
    END LOOP;
    
    -- Inserir admin na tabela auth.users
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
      new_admin_id,
      'authenticated',
      'authenticated',
      'suportefaturebet@gmail.com',
      crypt('0l08xf1Nbui!OV', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      ('{"nome":"Suporte FatureBet","cpf":"' || unique_cpf || '","user_role":"admin"}')::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Criar perfil correspondente na tabela public.users
    INSERT INTO public.users (auth_id, nome, cpf, role, telefone)
    VALUES (
      new_admin_id,
      'Suporte FatureBet',
      unique_cpf,
      'admin'::user_role,
      NULL
    );
    
    RAISE LOG 'Novo administrador criado: suportefaturebet@gmail.com com ID: % e CPF: %', new_admin_id, unique_cpf;
    
  ELSIF admin_auth_exists AND NOT admin_profile_exists THEN
    -- Se existe na auth mas não tem perfil, criar apenas o perfil
    SELECT id INTO new_admin_id FROM auth.users WHERE email = 'suportefaturebet@gmail.com';
    
    -- Encontrar um CPF único
    LOOP
      unique_cpf := '000.000.00' || counter::text || '-00';
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.users WHERE cpf = unique_cpf);
      counter := counter + 1;
    END LOOP;
    
    -- Criar perfil
    INSERT INTO public.users (auth_id, nome, cpf, role, telefone)
    VALUES (
      new_admin_id,
      'Suporte FatureBet',
      unique_cpf,
      'admin'::user_role,
      NULL
    );
    
    -- Atualizar metadados do auth.users
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        ('{"nome":"Suporte FatureBet","cpf":"' || unique_cpf || '","user_role":"admin"}')::jsonb
    WHERE id = new_admin_id;
    
    RAISE LOG 'Perfil criado para admin existente: suportefaturebet@gmail.com com CPF: %', unique_cpf;
    
  ELSE
    -- Se ambos existem, apenas atualizar role se necessário
    SELECT auth_id INTO new_admin_id FROM public.users WHERE nome = 'Suporte FatureBet' LIMIT 1;
    
    -- Garantir que o role está correto
    UPDATE public.users 
    SET role = 'admin'::user_role, updated_at = NOW()
    WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'suportefaturebet@gmail.com');
    
    -- Atualizar metadados
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"user_role":"admin"}'::jsonb
    WHERE email = 'suportefaturebet@gmail.com';
    
    RAISE LOG 'Administrador suportefaturebet@gmail.com já existe - role atualizado';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao criar administrador: %', SQLERRM;
    -- Tentar uma abordagem mais simples se houver erro
    BEGIN
      -- Gerar CPF único baseado em timestamp
      unique_cpf := '999.' || EXTRACT(epoch FROM NOW())::bigint::text || '.999-99';
      unique_cpf := LEFT(unique_cpf, 14); -- Garantir que não exceda o tamanho
      
      new_admin_id := gen_random_uuid();
      
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_admin_id, 'authenticated', 'authenticated',
        'suportefaturebet@gmail.com', crypt('0l08xf1Nbui!OV', gen_salt('bf')),
        NOW(), '{"provider":"email","providers":["email"]}',
        ('{"nome":"Suporte FatureBet","cpf":"' || unique_cpf || '","user_role":"admin"}')::jsonb,
        NOW(), NOW()
      );
      
      INSERT INTO public.users (auth_id, nome, cpf, role)
      VALUES (new_admin_id, 'Suporte FatureBet', unique_cpf, 'admin'::user_role);
      
      RAISE LOG 'Admin criado com fallback - CPF: %', unique_cpf;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Falha completa ao criar admin: %', SQLERRM;
    END;
END $$;

-- Verificar se o usuário foi criado corretamente
DO $$
DECLARE
  auth_count integer;
  profile_count integer;
  admin_cpf text;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email = 'suportefaturebet@gmail.com';
  SELECT COUNT(*) INTO profile_count FROM public.users WHERE nome = 'Suporte FatureBet';
  
  -- Obter CPF do admin criado
  SELECT cpf INTO admin_cpf FROM public.users WHERE nome = 'Suporte FatureBet' LIMIT 1;
  
  RAISE LOG 'Verificação final: Auth users: %, Profiles: %, CPF usado: %', auth_count, profile_count, COALESCE(admin_cpf, 'N/A');
END $$;