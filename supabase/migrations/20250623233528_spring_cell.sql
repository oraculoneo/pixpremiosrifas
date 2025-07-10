/*
  # Schema Inicial do Sistema de Rifas

  1. Tabelas Principais
    - `users` - Usuários do sistema (com autenticação Supabase)
    - `sorteios` - Sorteios/rifas
    - `premios` - Prêmios de cada sorteio
    - `comprovantes` - Comprovantes de pagamento
    - `numeros_rifa` - Números gerados para cada usuário
    - `cupons` - Cupons de desconto
    - `system_config` - Configurações do sistema

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para usuários e administradores
    - Autenticação via Supabase Auth

  3. Funcionalidades
    - Triggers para auditoria
    - Funções para geração de números
    - Validações de integridade
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE comprovante_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
CREATE TYPE sorteio_status AS ENUM ('aberto', 'encerrado');
CREATE TYPE cupom_tipo AS ENUM ('quantidade', 'percentual');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sorteios table
CREATE TABLE IF NOT EXISTS public.sorteios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  data_inicio timestamptz DEFAULT now(),
  data_fim timestamptz,
  status sorteio_status DEFAULT 'aberto',
  video_link text,
  numeros_premiados text[],
  configuracao jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Premios table
CREATE TABLE IF NOT EXISTS public.premios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sorteio_id uuid REFERENCES public.sorteios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  quantidade_numeros integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Comprovantes table
CREATE TABLE IF NOT EXISTS public.comprovantes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  valor_informado decimal(10,2) NOT NULL,
  valor_lido decimal(10,2),
  imagem_comprovante text NOT NULL,
  status comprovante_status DEFAULT 'pendente',
  cupom_usado text,
  desconto_aplicado decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Numeros rifa table
CREATE TABLE IF NOT EXISTS public.numeros_rifa (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  sorteio_id uuid REFERENCES public.sorteios(id) ON DELETE CASCADE,
  numero_gerado text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Cupons table
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo text UNIQUE NOT NULL,
  tipo cupom_tipo NOT NULL,
  valor integer NOT NULL,
  ativo boolean DEFAULT true,
  data_expiracao timestamptz,
  uso_maximo integer,
  uso_atual integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON public.users(cpf);
CREATE INDEX IF NOT EXISTS idx_comprovantes_user_id ON public.comprovantes(user_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_status ON public.comprovantes(status);
CREATE INDEX IF NOT EXISTS idx_numeros_rifa_user_id ON public.numeros_rifa(user_id);
CREATE INDEX IF NOT EXISTS idx_numeros_rifa_sorteio_id ON public.numeros_rifa(sorteio_id);
CREATE INDEX IF NOT EXISTS idx_numeros_rifa_numero ON public.numeros_rifa(numero_gerado);
CREATE INDEX IF NOT EXISTS idx_sorteios_status ON public.sorteios(status);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_premios_sorteio_id ON public.premios(sorteio_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_rifa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for sorteios table
CREATE POLICY "Anyone can read sorteios" ON public.sorteios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sorteios" ON public.sorteios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for premios table
CREATE POLICY "Anyone can read premios" ON public.premios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage premios" ON public.premios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for comprovantes table
CREATE POLICY "Users can read own comprovantes" ON public.comprovantes
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own comprovantes" ON public.comprovantes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all comprovantes" ON public.comprovantes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for numeros_rifa table
CREATE POLICY "Users can read own numbers" ON public.numeros_rifa
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all numbers" ON public.numeros_rifa
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for cupons table
CREATE POLICY "Anyone can read active cupons" ON public.cupons
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admins can manage cupons" ON public.cupons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for system_config table
CREATE POLICY "Anyone can read system config" ON public.system_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sorteios_updated_at
  BEFORE UPDATE ON public.sorteios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comprovantes_updated_at
  BEFORE UPDATE ON public.comprovantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cupons_updated_at
  BEFORE UPDATE ON public.cupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system configuration
INSERT INTO public.system_config (key, value) VALUES
  ('ai_validation_enabled', 'true'),
  ('min_deposit_amount', '100'),
  ('numbers_per_block', '10'),
  ('block_value', '100'),
  ('system_name', '"Sistema de Rifas"'),
  ('primary_color', '"#059669"'),
  ('secondary_color', '"#3B82F6"'),
  ('accent_color', '"#F59E0B"'),
  ('logo_url', '""')
ON CONFLICT (key) DO NOTHING;

-- Create function to generate raffle numbers
CREATE OR REPLACE FUNCTION public.generate_raffle_numbers(
  p_user_id uuid,
  p_sorteio_id uuid,
  p_valor decimal,
  p_bonus_numbers integer DEFAULT 0
)
RETURNS integer AS $$
DECLARE
  v_block_value decimal;
  v_numbers_per_block integer;
  v_total_numbers integer;
  v_sorteio_config jsonb;
  v_min_num integer;
  v_max_num integer;
  v_generated_number text;
  v_counter integer := 0;
BEGIN
  -- Get system configuration
  SELECT (value::text)::decimal INTO v_block_value 
  FROM public.system_config WHERE key = 'block_value';
  
  SELECT (value::text)::integer INTO v_numbers_per_block 
  FROM public.system_config WHERE key = 'numbers_per_block';
  
  -- Get sorteio configuration
  SELECT configuracao INTO v_sorteio_config 
  FROM public.sorteios WHERE id = p_sorteio_id;
  
  v_min_num := COALESCE((v_sorteio_config->>'numero_minimo')::integer, 1);
  v_max_num := COALESCE((v_sorteio_config->>'numero_maximo')::integer, 99999);
  
  -- Calculate total numbers to generate
  v_total_numbers := FLOOR(p_valor / v_block_value) * v_numbers_per_block + p_bonus_numbers;
  
  -- Generate numbers
  WHILE v_counter < v_total_numbers LOOP
    v_generated_number := LPAD((FLOOR(RANDOM() * (v_max_num - v_min_num + 1)) + v_min_num)::text, 5, '0');
    
    -- Check if number already exists for this raffle
    IF NOT EXISTS (
      SELECT 1 FROM public.numeros_rifa 
      WHERE sorteio_id = p_sorteio_id AND numero_gerado = v_generated_number
    ) THEN
      INSERT INTO public.numeros_rifa (user_id, sorteio_id, numero_gerado)
      VALUES (p_user_id, p_sorteio_id, v_generated_number);
      
      v_counter := v_counter + 1;
    END IF;
  END LOOP;
  
  RETURN v_total_numbers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;