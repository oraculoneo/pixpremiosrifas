import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Play, Hash, Target, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Sorteio, NumeroRifa } from '../../types';
import { RaffleModal } from '../Common/RaffleModal';
import { formatDate } from '../../utils/formatters';

const ActiveRaffles: React.FC = () => {
  const { user } = useAuth();
  const [activeRaffles, setActiveRaffles] = useState<Sorteio[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<Sorteio | null>(null);
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [userRaffleNumbers, setUserRaffleNumbers] = useState<NumeroRifa[]>([]);
  const [raffleStats, setRaffleStats] = useState<{
    totalNumeros: number;
    numerosVendidos: number;
    numerosRestantes: number;
    percentualVendido: string;
  } | null>(null);

  useEffect(() => {
    loadActiveRaffles();
  }, []);

  const loadActiveRaffles = async () => {
    try {
      const response = await fetch('/api/sorteios/ativos');
      const raffles = response.ok ? await response.json() : [];
      setActiveRaffles(raffles);
    } catch (error) {
      console.error('Erro ao carregar sorteios ativos:', error);
    }
  };



  const handleRaffleClick = async (raffle: Sorteio) => {
    setSelectedRaffle(raffle);
    setShowRaffleModal(true);
    
    // Fetch user numbers for this raffle
    await fetchUserNumbersForRaffle(raffle.id);
    
    // Fetch raffle statistics
    await fetchRaffleStats(raffle.id);
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

  const fetchRaffleStats = async (sorteioId: string) => {
    try {
      const response = await fetch(`/api/sorteios/${sorteioId}/estatisticas`);
      if (response.ok) {
        const stats = await response.json();
        setRaffleStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="futuristic-header text-xl sm:text-2xl">SORTEIOS ATIVOS</h1>
        <p className="futuristic-text mt-1 text-sm sm:text-base opacity-80">
          Veja todos os sorteios abertos e participe
        </p>
      </div>

      {activeRaffles.length === 0 ? (
        <div className="text-center py-12 futuristic-card">
          <Trophy className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h3 className="futuristic-header text-lg mb-2">NENHUM SORTEIO ATIVO</h3>
          <p className="futuristic-text opacity-80">
            Não há sorteios abertos no momento. Fique atento para novas oportunidades!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRaffles.map((raffle) => (
            <button
              key={raffle.id}
              onClick={() => handleRaffleClick(raffle)}
              className="futuristic-card shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden text-left hover:scale-105"
            >
              {/* Banner Image */}
              {raffle.banner_image && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={raffle.banner_image}
                    alt={`Banner ${raffle.nome}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{raffle.nome}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Aberto</span>
                  </div>
                </div>

                {/* Draw Date */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {raffle.data_sorteio 
                        ? `Sorteio: ${formatDate(raffle.data_sorteio)}`
                        : 'Data do sorteio a ser definida'
                      }
                    </span>
                  </div>
                </div>

                {/* Creation Date */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Criado em {formatDate(raffle.created_at)}</span>
                  </div>
                </div>

                {/* Video Link */}
                {raffle.video_link && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Vídeo disponível</span>
                    </div>
                  </div>
                )}



                {/* Prizes Preview */}
                {raffle.premios && raffle.premios.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
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
      )}

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
    </div>
  );
};

export default ActiveRaffles;