import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    cpf: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    systemName: 'Sistema de Rifas',
    logoUrl: '',
    primaryColor: '#059669',
    secondaryColor: '#3B82F6',
    accentColor: '#F59E0B'
  });
  const { login } = useAuth();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      // Carregar todas as configurações do sistema
      const response = await fetch('/api/system-config');
      if (response.ok) {
        const configs = await response.json();
        
        // Converter array de configs para objeto
        const configMap = configs.reduce((acc: any, config: any) => {
          acc[config.key] = config.value;
          return acc;
        }, {});
        
        const newConfig = {
          systemName: configMap.system_name || 'Sistema de Rifas',
          logoUrl: configMap.logo_url || '',
          primaryColor: configMap.primary_color || '#059669',
          secondaryColor: configMap.secondary_color || '#3B82F6',
          accentColor: configMap.accent_color || '#F59E0B'
        };
        
        setSystemConfig(newConfig);
        document.title = newConfig.systemName;
        
        // Aplicar cores customizadas ao CSS
        document.documentElement.style.setProperty('--primary-color', newConfig.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', newConfig.secondaryColor);
        document.documentElement.style.setProperty('--accent-color', newConfig.accentColor);
      } else {
        // Fallback para configuração padrão
        const defaultConfig = {
          systemName: 'Sistema de Rifas',
          logoUrl: '',
          primaryColor: '#059669',
          secondaryColor: '#3B82F6',
          accentColor: '#F59E0B'
        };
        setSystemConfig(defaultConfig);
        document.title = defaultConfig.systemName;
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      const defaultConfig = {
        systemName: 'Sistema de Rifas',
        logoUrl: '',
        primaryColor: '#059669',
        secondaryColor: '#3B82F6',
        accentColor: '#F59E0B'
      };
      setSystemConfig(defaultConfig);
      document.title = defaultConfig.systemName;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação no frontend
    if (!formData.cpf.trim()) {
      setError('CPF é obrigatório');
      setLoading(false);
      return;
    }

    // Limpar CPF e validar formato
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      setError('CPF deve ter 11 dígitos');
      setLoading(false);
      return;
    }

    if (!formData.senha.trim()) {
      setError('Senha é obrigatória');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 3) {
      setError('Senha deve ter pelo menos 3 caracteres');
      setLoading(false);
      return;
    }

    // Tentativa de login
    const result = await login(cpfNumbers, formData.senha);
    
    if (!result.success) {
      // Mostrar mensagem de erro específica do servidor
      const errorMessage = result.error || 'Erro desconhecido';
      console.error('Erro no login:', errorMessage);
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="futuristic-card p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            {systemConfig.logoUrl ? (
              <img 
                src={systemConfig.logoUrl} 
                alt="Logo" 
                className="w-20 h-20 object-contain rounded-2xl border border-cyan-400 shadow-lg shadow-cyan-400/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-400/50 border border-cyan-400 bg-gradient-to-br from-cyan-500 to-purple-600">
                <span className="text-white font-bold text-3xl font-mono">
                  {systemConfig.systemName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h1 className="futuristic-header text-4xl mb-2">
            {systemConfig.systemName}
          </h1>
          <p className="futuristic-text text-lg font-medium opacity-80">
            ACESSO AO SISTEMA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="futuristic-card border-2 border-red-500/50 bg-red-500/10 p-4 mb-4 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 futuristic-error" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="futuristic-error text-base font-semibold font-mono">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 futuristic-text font-mono uppercase tracking-wider">
            CPF
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({...formData, cpf: e.target.value})}
              className="w-full pl-10 pr-3 py-3 futuristic-input"
              placeholder="000.000.000-00"
              disabled={loading}
              maxLength={14}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 futuristic-text font-mono uppercase tracking-wider">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              className="w-full pl-10 pr-10 py-3 futuristic-input"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 futuristic-button disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-6 h-6 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
        </form>

        <div className="mt-6 text-center">
          <p style={{ color: systemConfig.accentColor }}>
            Não tem uma conta?{' '}
            <button
              onClick={onToggleMode}
              className="font-medium underline hover:opacity-80 transition-opacity"
              style={{ color: systemConfig.accentColor }}
              disabled={loading}
            >
              Criar conta
            </button>
          </p>
        </div>


      </div>
    </div>
  );
};

export default LoginForm;