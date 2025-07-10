import React, { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [systemConfig, setSystemConfig] = useState({
    systemName: 'Sistema de Rifas',
    logoUrl: ''
  });

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config');
      if (response.ok) {
        const configs = await response.json();
        const systemNameConfig = configs.find((c: any) => c.key === 'system_name');
        const logoUrlConfig = configs.find((c: any) => c.key === 'logo_url');
        
        const systemName = systemNameConfig?.value || 'Sistema de Rifas';
        const logoUrl = logoUrlConfig?.value || '';
        
        setSystemConfig({
          systemName,
          logoUrl
        });

        // Update page title
        document.title = systemName;
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
    }
  };

  return (
    <header className="futuristic-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              {systemConfig.logoUrl ? (
                <img 
                  src={systemConfig.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 object-contain rounded-xl border border-cyan-400 shadow-lg shadow-cyan-400/50"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-400/50 border border-cyan-400">
                  <span className="text-white font-bold text-lg font-mono">R</span>
                </div>
              )}
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <h1 className="futuristic-header text-lg sm:text-xl truncate">{title}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span className="futuristic-text text-sm truncate max-w-32">{user?.nome}</span>
              {user?.role === 'admin' && (
                <span className="px-2 py-1 text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-400 rounded-full font-mono">
                  ADMIN
                </span>
              )}
            </div>
            
            <button
              onClick={logout}
              className="futuristic-button flex items-center space-x-2 px-2 sm:px-3 py-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">SAIR</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;