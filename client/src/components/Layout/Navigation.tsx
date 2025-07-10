import React from 'react';
import { Home, Upload, Hash, History, Settings, Users, FileText, Trophy, Cog, Ticket, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { user } = useAuth();

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'active-raffles', label: 'Sorteios Ativos', icon: Trophy },
    { id: 'upload', label: 'Enviar Comprovante', icon: Upload },
    { id: 'vouchers', label: 'Comprovantes Enviados', icon: Receipt },
    { id: 'numbers', label: 'Meus Números', icon: Hash },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'vouchers', label: 'Comprovantes', icon: FileText },
    { id: 'raffles', label: 'Sorteios', icon: Trophy },
    { id: 'coupons', label: 'Cupons', icon: Ticket },
    { id: 'settings', label: 'Configurações', icon: Cog },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <nav className="futuristic-nav border-b md:border-r md:border-b-0 border-cyan-400/30 w-full md:w-16 lg:w-64 md:min-h-screen">
      <div className="p-1 md:p-2 lg:p-4">
        {/* Mobile: Horizontal scrollable menu */}
        <div className="md:hidden">
          <ul className="flex space-x-1 overflow-x-auto pb-2 scrollbar-futuristic">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id} className="flex-shrink-0">
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 futuristic-nav-item min-w-max ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/50 shadow-lg shadow-cyan-400/30'
                        : 'hover:bg-cyan-500/10 hover:border-cyan-400/30 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-mono uppercase text-xs tracking-wider whitespace-nowrap">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Desktop: Vertical menu */}
        <div className="hidden md:block">
          <ul className="space-y-1 lg:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-2 lg:px-3 py-3 lg:py-3 rounded-xl text-sm font-medium transition-all duration-200 futuristic-nav-item ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/50 shadow-lg shadow-cyan-400/30 active'
                        : 'hover:bg-cyan-500/10 hover:border-cyan-400/30 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:inline truncate font-mono uppercase text-xs tracking-wider">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;