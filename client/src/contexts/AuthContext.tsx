import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Usar tipos do schema compartilhado
interface User {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (cpf: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    senha: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    const checkSession = () => {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          setUser(userData);
        } catch (error) {
          console.error('Erro ao analisar dados do usuário:', error);
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (cpf: string, senha: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Tratar diferentes tipos de erro baseado no status
        switch (response.status) {
          case 400:
            return { success: false, error: data.error || 'Dados inválidos' };
          case 401:
            return { success: false, error: data.error || 'CPF ou senha incorretos' };
          case 500:
            return { success: false, error: 'Erro interno do servidor. Tente novamente.' };
          default:
            return { success: false, error: data.error || 'Erro no login' };
        }
      }

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: 'Resposta inválida do servidor' };
    } catch (error) {
      console.error('Erro no login:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
      }
      return { success: false, error: 'Erro inesperado. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    senha: string;
  }) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: userData.nome,
          cpf: userData.cpf,
          telefone: userData.telefone,
          senha: userData.senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erro no registro' };
      }

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: 'Erro no registro' };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};