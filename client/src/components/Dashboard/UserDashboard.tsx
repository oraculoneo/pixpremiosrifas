import React, { useState, useEffect } from 'react';
import { Upload, Hash, History, Play, Calendar, Trophy, Clock, Target, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Comprovante, NumeroRifa, Sorteio } from '../../types';
import DashboardCard from './DashboardCard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { RaffleModal } from '../Common/RaffleModal';
import { VideoModal } from '../Common/VideoModal';

interface UserDashboardProps {
  onNavigate: (page: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    comprovantes: 0,
    numeros: 0,
    pendentes: 0,
    valorTotal: 0
  });
  const [allActiveRaffles, setAllActiveRaffles] = useState<Sorteio[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Sorteio | null>(null);
  const [userRaffleNumbers, setUserRaffleNumbers] = useState<NumeroRifa[]>([]);
  const [raffleStats, setRaffleStats] = useState<{
    totalNumeros: number;
    numerosVendidos: number;
    numerosRestantes: number;
    percentualVendido: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Otimização: fazer todas as requisições em paralelo
      const [comprovantesResponse, numerosResponse, sorteiosResponse] = await Promise.all([
        fetch(`/api/comprovantes/user/${user.id}`),
        fetch(`/api/numeros/user/${user.id}`),
        fetch('/api/sorteios/ativos')
      ]);

      const [userComprovantes, userNumeros, activeRaffles] = await Promise.all([
        comprovantesResponse.ok ? comprovantesResponse.json() : [],
        numerosResponse.ok ? numerosResponse.json() : [],
        sorteiosResponse.ok ? sorteiosResponse.json() : []
      ]);

      const pendentes = userComprovantes.filter((c: any) => c.status === 'pendente').length;
      const valorTotal = userComprovantes
        .filter((c: any) => c.status === 'aprovado')
        .reduce((sum: number, c: any) => sum + c.valor_informado, 0);

      setStats({
        comprovantes: userComprovantes.length,
        numeros: userNumeros.length,
        pendentes,
        valorTotal
      });

      // Set all active raffles
      setAllActiveRaffles(activeRaffles);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };



  const fetchUserNumbersForRaffle = async (sorteioId: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/numeros/user/${user.id}`);
      if (response.ok) {
        const allNumbers = await response.json();
        const raffleNumbers = allNumbers.filter((numero: NumeroRifa) => numero.sorteio_id === sorteioId);
        setUserRaffleNumbers(raffleNumbers);
      }
    } catch (error) {
      console.error('Erro ao carregar números do usuário:', error);
      setUserRaffleNumbers([]);
    }
  };

  const fetchRaffleStatistics = async (sorteioId: string) => {
    try {
      const response = await fetch(`/api/sorteios/${sorteioId}/estatisticas`);
      if (response.ok) {
        const stats = await response.json();
        setRaffleStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do sorteio:', error);
      setRaffleStats(null);
    }
  };

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8 slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
          Bem-vindo, {user?.nome}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-base sm:text-lg">Gerencie seus comprovantes e acompanhe seus números da sorte</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
        <div className="card-modern dark:card-modern-dark p-6 rounded-2xl slide-up">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.comprovantes}</p>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm lg:text-base truncate">Comprovantes</p>
            </div>
          </div>
        </div>

        <div className="card-modern dark:card-modern-dark p-6 rounded-2xl slide-up">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.numeros}</p>
              <p className="text-gray-600 dark:text-gray-300 text-base truncate">Números</p>
            </div>
          </div>
        </div>

        <div className="card-modern dark:card-modern-dark p-6 rounded-2xl slide-up">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendentes}</p>
              <p className="text-gray-600 dark:text-gray-300 text-base truncate">Pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sorteios Ativos */}
      {allActiveRaffles.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Sorteios Ativos</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {allActiveRaffles.map((raffle) => (
              <button
                key={raffle.id}
                onClick={() => {
                  setSelectedRaffle(raffle);
                  setShowRaffleModal(true);
                  fetchUserNumbersForRaffle(raffle.id);
                  fetchRaffleStatistics(raffle.id);
                }}
                className="card-modern dark:card-modern-dark rounded-2xl p-6 slide-up border border-green-200/50 dark:border-green-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 text-left w-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{raffle.nome}</h3>
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Aberto</span>
                      </div>
                    </div>
                  </div>
                  {raffle.video_link && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRaffle(raffle);
                        setShowVideoModal(true);
                      }}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors group"
                      title="Ver vídeo"
                    >
                      <Play className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em: {formatDate(raffle.created_at)}</span>
                  </div>
                  
                  {raffle.data_sorteio && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Sorteio: {formatDate(raffle.data_sorteio)}</span>
                    </div>
                  )}

                  {raffle.premios && raffle.premios.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>Prêmios</span>
                      </h4>
                      <div className="space-y-2">
                        {raffle.premios.slice(0, 3).map((premio, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                'bg-amber-600 text-white'
                              }`}>
                                {index + 1}°
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {premio.nome}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {premio.ordem}° Lugar
                            </span>
                          </div>
                        ))}
                        {raffle.premios.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            +{raffle.premios.length - 3} prêmios adicionais
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <DashboardCard
          title="Enviar Comprovante"
          description="Faça upload do comprovante de pagamento para gerar números"
          icon={Upload}
          onClick={() => onNavigate('upload')}
          badge={stats.pendentes > 0 ? `${stats.pendentes} pendente${stats.pendentes > 1 ? 's' : ''}` : undefined}
          badgeColor="yellow"
        />

        <DashboardCard
          title="Meus Números"
          description={`Visualize seus ${stats.numeros} números da sorte`}
          icon={Hash}
          onClick={() => onNavigate('numbers')}
          badge={stats.numeros > 0 ? `${stats.numeros} números` : 'Nenhum número'}
          badgeColor={stats.numeros > 0 ? 'green' : 'red'}
        />

        <DashboardCard
          title="Histórico"
          description="Veja o histórico de sorteios anteriores"
          icon={History}
          onClick={() => onNavigate('history')}
        />
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal && selectedRaffle?.video_link !== undefined}
        onClose={() => setShowVideoModal(false)}
        videoLink={selectedRaffle?.video_link || ''}
        title={`Vídeo do Sorteio: ${selectedRaffle?.nome || ''}`}
        subtitle={selectedRaffle?.nome}
        status={selectedRaffle?.status}
        showRaffleInfo={true}
      />

      {/* Raffle Details Modal */}
      <RaffleModal
        isOpen={showRaffleModal}
        onClose={() => {
          setShowRaffleModal(false);
          setUserRaffleNumbers([]);
          setRaffleStats(null);
        }}
        raffle={selectedRaffle}
        userNumbers={userRaffleNumbers}
        showUserNumbers={true}
        showVideo={true}
      />
      {false && selectedRaffle && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedRaffle.nome}
              </h3>
              <button
                onClick={() => {
                  setShowRaffleModal(false);
                  setUserRaffleNumbers([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                {/* Banner Image */}
                {selectedRaffle.banner_image && (
                  <div className="w-full">
                    <img
                      src={selectedRaffle.banner_image}
                      alt={`Banner ${selectedRaffle.nome}`}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {selectedRaffle.status === 'aberto' ? 'Aberto' : 'Encerrado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatDate(selectedRaffle.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Data do Sorteio</p>
                        {selectedRaffle.data_sorteio ? (
                          <p className="font-bold text-purple-600 dark:text-purple-400 text-xl">
                            🗓️ {formatDate(selectedRaffle.data_sorteio)}
                          </p>
                        ) : (
                          <p className="font-semibold text-orange-600 dark:text-orange-400 text-base">
                            ⏳ A ser definida
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Configuração dos Números
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total de números:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {raffleStats?.totalNumeros || selectedRaffle.total_numeros || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Números restantes:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {raffleStats?.numerosRestantes || 'Carregando...'}
                          </span>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>

                {/* User Numbers Section */}
                {userRaffleNumbers.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-6 border-2 border-green-200 dark:border-green-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <span>Seus Números ({userRaffleNumbers.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {userRaffleNumbers.map((numero, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-green-600 transition-colors"
                        >
                          {numero.numero_gerado}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-3 font-medium">
                      🍀 Boa sorte! Você tem {userRaffleNumbers.length} chances de ganhar neste sorteio.
                    </p>
                  </div>
                )}

                {userRaffleNumbers.length === 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Participar do Sorteio</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Você ainda não possui números neste sorteio. Faça um comprovante para participar!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prizes */}
                {selectedRaffle.premios && selectedRaffle.premios.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span>Prêmios Definidos ({selectedRaffle.premios.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedRaffle.premios.map((premio: any, index: number) => (
                        <div key={premio.id} className={`rounded-xl p-6 border-2 shadow-lg ${
                          premio.ordem === 1 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-600' :
                          premio.ordem === 2 ? 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 border-gray-300 dark:border-gray-600' :
                          'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-600'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md ${
                              premio.ordem === 1 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                              premio.ordem === 2 ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-white' :
                              'bg-gradient-to-br from-amber-600 to-orange-600 text-white'
                            }`}>
                              {premio.ordem === 1 ? '🥇' : premio.ordem === 2 ? '🥈' : '🥉'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {premio.ordem}° Lugar
                                </h5>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  premio.ordem === 1 ? 'bg-yellow-500 text-white' :
                                  premio.ordem === 2 ? 'bg-gray-500 text-white' :
                                  'bg-amber-600 text-white'
                                }`}>
                                  {premio.quantidade_numeros} sorteio{premio.quantidade_numeros > 1 ? 's' : ''}
                                </div>
                              </div>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                {premio.nome}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {premio.quantidade_numeros} número{premio.quantidade_numeros > 1 ? 's' : ''} será{premio.quantidade_numeros > 1 ? 'ão' : ''} sorteado{premio.quantidade_numeros > 1 ? 's' : ''} para este prêmio
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {selectedRaffle.video_link && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <Play className="w-5 h-5 text-red-500" />
                      <span>Vídeo do Sorteio</span>
                    </h4>
                    <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={extractVideoUrl(selectedRaffle.video_link)}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Winning Numbers */}
                {selectedRaffle.numeros_premiados && selectedRaffle.numeros_premiados.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-green-500" />
                      <span>Números Premiados</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRaffle.numeros_premiados.map((numero: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                        >
                          {numero}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={() => {
                  setShowRaffleModal(false);
                  setUserRaffleNumbers([]);
                  setRaffleStats(null);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;