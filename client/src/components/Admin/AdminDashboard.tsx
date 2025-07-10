import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, XCircle, Target, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { User, Comprovante, Sorteio, NumeroRifa } from '../../types/database';
import RaffleNumberManagement from './RaffleNumberManagement';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVouchers: 0,
    approvedVouchers: 0,
    rejectedVouchers: 0,
    activeRaffles: 0,
    totalNumbersSold: 0,
    totalDeposited: 0
  });

  const [recentActivity, setRecentActivity] = useState<Comprovante[]>([]);
  const [topUsers, setTopUsers] = useState<Array<{user: User, totalDeposited: number, totalApproved: number}>>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{month: string, deposits: number, revenue: number}>>([]);
  const [currentRaffle, setCurrentRaffle] = useState<Sorteio | null>(null);
  const [showNumberManagement, setShowNumberManagement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Usar endpoint otimizado que combina todas as informações
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setTopUsers(data.topUsers);
        setMonthlyData(data.monthlyData);
        setCurrentRaffle(data.currentRaffle);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-4">
      {/* Mobile-optimized header */}
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <h1 className="futuristic-header text-xl md:text-3xl text-center md:text-left">DASHBOARD ADMINISTRATIVO</h1>
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
          <button
            onClick={() => onNavigate('vouchers')}
            className="futuristic-button px-3 py-2 text-xs md:text-sm"
          >
            <FileText className="w-4 h-4 md:hidden mr-2" />
            GERENCIAR COMPROVANTES
          </button>
          <button
            onClick={() => onNavigate('raffles')}
            className="futuristic-button px-3 py-2 text-xs md:text-sm"
          >
            <Target className="w-4 h-4 md:hidden mr-2" />
            GERENCIAR RIFAS
          </button>
        </div>
      </div>

      {/* Stats Cards - Mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase truncate">Total de Usuários</p>
              <p className="text-xl md:text-2xl font-bold futuristic-header">{stats.totalUsers}</p>
            </div>
            <Users className="h-6 w-6 md:h-8 md:w-8 text-cyan-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase truncate">Comprovantes Pendentes</p>
              <p className="text-xl md:text-2xl font-bold futuristic-warning">{stats.pendingVouchers}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase truncate">Comprovantes Aprovados</p>
              <p className="text-xl md:text-2xl font-bold text-green-400">{stats.approvedVouchers}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase truncate">Rifas Ativas</p>
              <p className="text-xl md:text-2xl font-bold text-purple-400">{stats.activeRaffles}</p>
            </div>
            <Target className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Financial Stats - Mobile optimized */}
      <div className="grid grid-cols-1 gap-3 md:gap-6">
        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold futuristic-header font-mono uppercase">Total Depositado</h3>
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-400 font-mono">
            R$ {stats.totalDeposited.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
        </div>
      </div>

      {/* Charts - Mobile optimized */}
      {monthlyData.length > 0 && (
        <div className="futuristic-card p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold futuristic-header mb-3 md:mb-4 font-mono uppercase">Receita Mensal</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={250} className="md:h-80">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.2)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#06b6d4' }}
                  axisLine={{ stroke: '#06b6d4' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#06b6d4' }}
                  axisLine={{ stroke: '#06b6d4' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'deposits' 
                      ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : `${value.toLocaleString('pt-BR')} números`,
                    name === 'deposits' ? 'Depósitos' : 'Números Vendidos'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #06b6d4', 
                    borderRadius: '8px',
                    color: '#06b6d4'
                  }}
                />
                <Legend />
                <Bar dataKey="deposits" fill="#10b981" name="Depósitos" />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Números Vendidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity & Top Users - Mobile optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Recent Activity */}
        <div className="futuristic-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold futuristic-header font-mono uppercase">Atividade Recente</h3>
            <Activity className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
          </div>
          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((comprovante) => (
                <div key={comprovante.id} className="flex items-center justify-between p-2 md:p-3 bg-black/20 border border-cyan-400/20 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium futuristic-text text-sm md:text-base font-mono">
                      R$ {Number(comprovante.valor_informado).toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </p>
                    <p className="text-xs md:text-sm futuristic-text opacity-70">
                      {new Date(comprovante.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-mono uppercase border flex-shrink-0 ml-2 ${
                    comprovante.status === 'aprovado' 
                      ? 'bg-green-400/20 text-green-400 border-green-400/50'
                      : comprovante.status === 'rejeitado'
                      ? 'bg-red-400/20 text-red-400 border-red-400/50'
                      : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50'
                  }`}>
                    {comprovante.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="futuristic-text opacity-70 text-center py-6 text-sm md:text-base">
                Nenhuma atividade recente
              </p>
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="futuristic-card p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold futuristic-header mb-3 md:mb-4 font-mono uppercase">Top Usuários</h3>
          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-80 overflow-y-auto">
            {topUsers.length > 0 ? (
              topUsers.map((userStat, index) => (
                <div key={userStat.user.id} className="flex items-center justify-between p-2 md:p-3 bg-black/20 border border-cyan-400/20 rounded-lg">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium futuristic-text text-sm md:text-base truncate">{userStat.user.nome}</p>
                      <p className="text-xs md:text-sm futuristic-text opacity-70">{userStat.totalApproved} comprovantes</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-green-400 text-sm md:text-base font-mono">
                      R$ {userStat.totalDeposited.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="futuristic-text opacity-70 text-center py-6 text-sm md:text-base">
                Nenhum usuário com depósitos aprovados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Current Raffle Info - Mobile optimized */}
      {currentRaffle && (
        <div className="futuristic-card p-4 md:p-6">
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold futuristic-header font-mono uppercase">Rifa Atual</h3>
            <button
              onClick={() => setShowNumberManagement(true)}
              className="futuristic-button px-3 py-2 text-xs md:text-sm"
            >
              <Target className="w-4 h-4 md:hidden mr-2" />
              Gerenciar Números
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase">Nome</p>
              <p className="text-sm md:text-lg font-semibold futuristic-header truncate">{currentRaffle.nome}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase">Status</p>
              <p className="text-sm md:text-lg font-semibold text-green-400 font-mono uppercase">{currentRaffle.status}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium futuristic-text opacity-80 font-mono uppercase">Data de Início</p>
              <p className="text-sm md:text-lg font-semibold futuristic-text font-mono">
                {new Date(currentRaffle.data_inicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Number Management Modal */}
      {showNumberManagement && currentRaffle && (
        <RaffleNumberManagement
          sorteio={currentRaffle}
          onClose={() => setShowNumberManagement(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;