export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          nome: string
          cpf: string
          telefone: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          nome: string
          cpf: string
          telefone?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          nome?: string
          cpf?: string
          telefone?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      sorteios: {
        Row: {
          id: string
          nome: string
          data_inicio: string
          data_fim: string | null
          status: 'aberto' | 'encerrado'
          video_link: string | null
          numeros_premiados: string[] | null
          configuracao: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          data_inicio?: string
          data_fim?: string | null
          status?: 'aberto' | 'encerrado'
          video_link?: string | null
          numeros_premiados?: string[] | null
          configuracao?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          data_inicio?: string
          data_fim?: string | null
          status?: 'aberto' | 'encerrado'
          video_link?: string | null
          numeros_premiados?: string[] | null
          configuracao?: Json
          created_at?: string
          updated_at?: string
        }
      }
      premios: {
        Row: {
          id: string
          sorteio_id: string
          nome: string
          quantidade_numeros: number
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          sorteio_id: string
          nome: string
          quantidade_numeros?: number
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          sorteio_id?: string
          nome?: string
          quantidade_numeros?: number
          ordem?: number
          created_at?: string
        }
      }
      comprovantes: {
        Row: {
          id: string
          user_id: string
          valor_informado: number
          valor_lido: number | null
          imagem_comprovante: string
          status: 'pendente' | 'aprovado' | 'rejeitado'
          cupom_usado: string | null
          desconto_aplicado: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          valor_informado: number
          valor_lido?: number | null
          imagem_comprovante: string
          status?: 'pendente' | 'aprovado' | 'rejeitado'
          cupom_usado?: string | null
          desconto_aplicado?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          valor_informado?: number
          valor_lido?: number | null
          imagem_comprovante?: string
          status?: 'pendente' | 'aprovado' | 'rejeitado'
          cupom_usado?: string | null
          desconto_aplicado?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      numeros_rifa: {
        Row: {
          id: string
          user_id: string
          sorteio_id: string
          numero_gerado: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sorteio_id: string
          numero_gerado: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sorteio_id?: string
          numero_gerado?: string
          created_at?: string
        }
      }
      cupons: {
        Row: {
          id: string
          codigo: string
          tipo: 'quantidade' | 'percentual'
          valor: number
          ativo: boolean
          data_expiracao: string | null
          uso_maximo: number | null
          uso_atual: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          tipo: 'quantidade' | 'percentual'
          valor: number
          ativo?: boolean
          data_expiracao?: string | null
          uso_maximo?: number | null
          uso_atual?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          tipo?: 'quantidade' | 'percentual'
          valor?: number
          ativo?: boolean
          data_expiracao?: string | null
          uso_maximo?: number | null
          uso_atual?: number
          created_at?: string
          updated_at?: string
        }
      }
      system_config: {
        Row: {
          id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_raffle_numbers: {
        Args: {
          p_user_id: string
          p_sorteio_id: string
          p_valor: number
          p_bonus_numbers?: number
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'user' | 'admin'
      comprovante_status: 'pendente' | 'aprovado' | 'rejeitado'
      sorteio_status: 'aberto' | 'encerrado'
      cupom_tipo: 'quantidade' | 'percentual'
    }
  }
}