import React, { useState } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import UserDashboard from './components/Dashboard/UserDashboard';
import VoucherUpload from './components/Upload/VoucherUpload';
import UserNumbers from './components/Numbers/UserNumbers';
import UserHistory from './components/History/UserHistory';
import ActiveRaffles from './components/Raffles/ActiveRaffles';
import UserVouchers from './components/Vouchers/UserVouchers';
import AdminDashboard from './components/Admin/AdminDashboard';
import VoucherManagement from './components/Admin/VoucherManagement';
import RaffleManagement from './components/Admin/RaffleManagement';
import UserManagement from './components/Admin/UserManagement';

import SystemSettings from './components/Admin/SystemSettings';
import CouponManagement from './components/Admin/CouponManagement';
import { Loader } from 'lucide-react';
import FuturisticParticles from './components/Layout/FuturisticParticles';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FuturisticParticles />
        <div className="text-center futuristic-card p-8 fade-in z-10 relative">
          <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="futuristic-text font-medium">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <FuturisticParticles />
        <div className="w-full max-w-md slide-up z-10 relative">
          {authMode === 'login' ? (
            <LoginForm onToggleMode={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onToggleMode={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (user.role === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setCurrentPage} />;
        case 'users':
          return <UserManagement />;
        case 'vouchers':
          return <VoucherManagement />;
        case 'raffles':
          return <RaffleManagement />;

        case 'coupons':
          return <CouponManagement />;
        case 'settings':
          return <SystemSettings />;
        default:
          return <AdminDashboard onNavigate={setCurrentPage} />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <UserDashboard onNavigate={setCurrentPage} />;
        case 'active-raffles':
          return <ActiveRaffles />;
        case 'upload':
          return <VoucherUpload />;
        case 'vouchers':
          return <UserVouchers />;
        case 'numbers':
          return <UserNumbers />;
        case 'history':
          return <UserHistory />;
        default:
          return <UserDashboard onNavigate={setCurrentPage} />;
      }
    }
  };

  const getPageTitle = () => {
    if (user.role === 'admin') {
      switch (currentPage) {
        case 'dashboard': return 'Painel Administrativo';
        case 'users': return 'Gerenciar Usuários';
        case 'vouchers': return 'Gerenciar Comprovantes';
        case 'raffles': return 'Gerenciar Sorteios';

        case 'coupons': return 'Gerenciar Cupons';
        case 'settings': return 'Configurações do Sistema';
        default: return 'Painel Administrativo';
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return 'Dashboard';
        case 'active-raffles': return 'Sorteios Ativos';
        case 'upload': return 'Enviar Comprovante';
        case 'vouchers': return 'Comprovantes Enviados';
        case 'numbers': return 'Meus Números';
        case 'history': return 'Histórico';
        default: return 'Sistema de Rifas';
      }
    }
  };

  return (
    <div className="min-h-screen">
      <FuturisticParticles />
      <div className="scan-line"></div>
      <div className="relative z-10">
        <Header title={getPageTitle()} />
        <div className="flex flex-col md:flex-row">
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex-1 min-h-screen p-2 sm:p-4 md:p-6 overflow-x-hidden">
            <div className="fade-in max-w-full">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;