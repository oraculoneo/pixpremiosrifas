import React, { useState, useEffect } from 'react';
import { History, Trophy, Play, Calendar, Hash, Crown, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NumeroRifa, Sorteio, HistoricoVencedor } from '../../types';
import { formatDate } from '../../utils/formatters';
import { VideoModal } from '../Common/VideoModal';

const UserHistory: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<(Sorteio & { userNumbers: NumeroRifa[], winningNumbers: Array<{numero: string, prizeName: string, isPrincipal: boolean}> })[]>([]);
  const [showVideoModal, setShowVideoModal] = useState<Sorteio | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      
      try {
        // Load user's numbers from API
        const numbersResponse = await fetch(`/api/numeros/user/${user.id}`);
        const allNumbers: NumeroRifa[] = numbersResponse.ok ? await numbersResponse.json() : [];
        
        // Load all sorteios from API
        const sorteiosResponse = await fetch('/api/sorteios');
        const allSorteios: Sorteio[] = sorteiosResponse.ok ? await sorteiosResponse.json() : [];

        const userNumbers = allNumbers.filter(n => n.user_id === user.id);
        
        const userHistory = allSorteios.map(sorteio => {
          const numbersInRaffle = userNumbers.filter(n => n.sorteio_id === sorteio.id);
          
          // Find winning numbers with prize information
          const winningNumbers = numbersInRaffle
            .filter(n => sorteio.numeros_premiados?.includes(n.numero_gerado))
            .map(n => {
              const numeroIndex = sorteio.numeros_premiados!.indexOf(n.numero_gerado);
              let currentIndex = 0;
              
              if (sorteio.premios) {
                for (const premio of sorteio.premios.sort((a, b) => a.ordem - b.ordem)) {
                  if (numeroIndex >= currentIndex && numeroIndex < currentIndex + premio.quantidade_numeros) {
                    return {
                      numero: n.numero_gerado,
                      prizeName: premio.nome,
                      isPrincipal: premio.ordem === 1
                    };
                  }
                  currentIndex += premio.quantidade_numeros;
                }
              }
              
              return {
                numero: n.numero_gerado,
                prizeName: 'Prêmio Principal',
                isPrincipal: true
              };
            });
          
          return {
            ...sorteio,
            userNumbers: numbersInRaffle,
            winningNumbers
          };
        }).filter(h => h.userNumbers.length > 0);

        userHistory.sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
        
        setHistory(userHistory);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setHistory([]);
      }
    };

    loadHistory();
  }, [user?.id]);



  if (history.length === 0) {
    return (
      <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Histórico</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Veja o histórico dos seus sorteios</p>
        </div>
        
        <div className="text-center py-8 sm:py-12">
          <History className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum histórico encontrado</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Você ainda não participou de nenhum sorteio. Envie um comprovante para começar!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Histórico</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Veja o histórico dos seus sorteios</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.nome}
                </h3>
              </div>
            </div>

            {/* Números Premiados */}
            {item.numeros_premiados && item.numeros_premiados.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Números sorteados:</p>
                <div className="flex flex-wrap gap-2">
                  {item.numeros_premiados.map((numero, index) => {
                    // Determine which prize this number belongs to
                    let currentIndex = 0;
                    let isPrincipal = true;
                    let prizeName = 'Prêmio Principal';
                    
                    if (item.premios) {
                      for (const premio of item.premios.sort((a, b) => a.ordem - b.ordem)) {
                        if (index >= currentIndex && index < currentIndex + premio.quantidade_numeros) {
                          isPrincipal = premio.ordem === 1;
                          prizeName = premio.nome;
                          break;
                        }
                        currentIndex += premio.quantidade_numeros;
                      }
                    }
                    
                    return (
                      <span
                        key={index}
                        className={`px-3 py-2 text-sm font-medium rounded ${
                          isPrincipal
                            ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                            : 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                        }`}
                        title={prizeName}
                      >
                        {numero}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Caso não haja números premiados ainda */}
            {(!item.numeros_premiados || item.numeros_premiados.length === 0) && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sorteio ainda não realizado
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal !== null && showVideoModal.video_link !== undefined}
        onClose={() => setShowVideoModal(null)}
        videoLink={showVideoModal?.video_link || ''}
        title={`Vídeo do Sorteio: ${showVideoModal?.nome || ''}`}
        subtitle={showVideoModal?.nome}
        status={showVideoModal?.status}
        endDate={showVideoModal?.data_fim}
        showRaffleInfo={true}
      />
    </div>
  );
};

export default UserHistory;