import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, CreditCard, Eye, EyeOff, Loader, Clock, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validateCPF, formatCPF, validatePhone, formatPhone, getCPFRegion } from '../../utils/auth';

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cpfRegion, setCpfRegion] = useState<string>('');
  const [systemConfig, setSystemConfig] = useState({
    systemName: 'Sistema de Rifas',
    logoUrl: ''
  });
  const { register } = useAuth();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTime]);

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config');
      if (response.ok) {
        const configs = await response.json();
        const systemNameConfig = configs.find((c: any) => c.key === 'system_name');
        const logoUrlConfig = configs.find((c: any) => c.key === 'logo_url');
        
        setSystemConfig({
          systemName: systemNameConfig?.value || 'Sistema de Rifas',
          logoUrl: logoUrlConfig?.value || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
    }
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({...formData, cpf: formatted});
    
    // Show region info if CPF is complete
    if (formatted.replace(/\D/g, '').length === 11) {
      setCpfRegion(getCPFRegion(formatted));
    } else {
      setCpfRegion('');
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData({...formData, telefone: formatted});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if we're in cooldown period
    if (cooldownTime > 0) {
      setLoading(false);
      return;
    }

    // Validation
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (!formData.email) {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    if (!formData.cpf) {
      setError('CPF é obrigatório');
      setLoading(false);
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido');
      setLoading(false);
      return;
    }

    if (!formData.telefone) {
      setError('Telefone é obrigatório');
      setLoading(false);
      return;
    }

    if (!validatePhone(formData.telefone)) {
      setError('Telefone inválido. Use o formato (XX) 9XXXX-XXXX');
      setLoading(false);
      return;
    }

    if (!formData.senha) {
      setError('Senha é obrigatória');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('Senhas não coincidem');
      setLoading(false);
      return;
    }

    const result = await register({
      nome: formData.nome.trim(),
      email: formData.email,
      cpf: formData.cpf,
      telefone: formData.telefone,
      senha: formData.senha
    });

    if (!result.success) {
      const errorMessage = result.error || 'Erro ao criar conta';
      
      // Check for rate limit error
      if (errorMessage.includes('rate limit')) {
        setCooldownTime(60); // 60 seconds cooldown
        setError('Muitas tentativas de cadastro. Aguarde 60 segundos antes de tentar novamente.');
      } else {
        setError(errorMessage);
      }
    }

    setLoading(false);
  };

  const isFormDisabled = loading || cooldownTime > 0;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {systemConfig.logoUrl ? (
            <img 
              src={systemConfig.logoUrl} 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{systemConfig.systemName}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Criar nova conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className={`border rounded-md p-3 ${
            cooldownTime > 0 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center">
              {cooldownTime > 0 && <Clock className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />}
              <p className={`text-sm ${
                cooldownTime > 0 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {error}
                {cooldownTime > 0 && (
                  <span className="font-medium ml-1">({cooldownTime}s)</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="Seu nome completo"
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="seu@email.com"
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CPF
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => handleCPFChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={isFormDisabled}
            />
          </div>
          {cpfRegion && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Região: {cpfRegion}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="(11) 99999-9999"
              maxLength={15}
              disabled={isFormDisabled}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Formato: (XX) 9XXXX-XXXX
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="••••••••"
              disabled={isFormDisabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              disabled={isFormDisabled}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmarSenha}
              onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="••••••••"
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isFormDisabled}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : cooldownTime > 0 ? (
            <>
              <Clock className="w-5 h-5 mr-2" />
              Aguarde {cooldownTime}s
            </>
          ) : (
            'Criar conta'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Já tem uma conta?{' '}
          <button
            onClick={onToggleMode}
            className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
            disabled={isFormDisabled}
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;