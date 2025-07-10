export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  isAdmin?: boolean; // For backward compatibility
  data_cadastro?: string; // For backward compatibility
  senha_hash?: string; // Only used internally
}

export interface Comprovante {
  id: string;
  user_id: string;
  sorteio_id: string;
  valor_informado: string;
  valor_lido: string;
  imagem_comprovante: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  cupom_usado?: string;
  desconto_aplicado?: string;
  resposta_admin?: string;
  created_at: string;
  updated_at: string;
  usuario_nome?: string;
}

export interface NumeroRifa {
  id: string;
  id_usuario: string;
  id_sorteio: string;
  numero_gerado: string;
  data_geracao?: string;
}

export interface Premio {
  id: string;
  sorteio_id?: string;
  nome: string;
  quantidade_numeros: number;
  ordem: number;
  created_at?: string;
}

export interface Sorteio {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim?: string;
  status: 'aberto' | 'encerrado';
  ganhador_id?: string;
  video_link?: string;
  numeros_premiados?: string[];
  premios?: Premio[];
  configuracao?: {
    total_numeros: number;
    numero_minimo: number;
    numero_maximo: number;
    numeros_por_usuario?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Cupom {
  id: string;
  codigo: string;
  tipo: 'quantidade' | 'percentual';
  valor: number;
  ativo: boolean;
  data_criacao: string;
  data_expiracao?: string;
  uso_maximo?: number;
  uso_atual: number;
}

export interface HistoricoVencedor {
  id: string;
  id_usuario: string;
  id_sorteio: string;
  numeros_premiados: string[];
  data: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { senha: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}