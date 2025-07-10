import React, { useState, useEffect } from 'react';
import { Hash, Calendar, Trophy, Eye, Award, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NumeroRifa, Sorteio, Comprovante } from '../../types';
import { formatDate } from '../../utils/raffle';

const UserNumbers: React.FC = () => {
  const { user } = useAuth();
  const [numbers, setNumbers] = useState<NumeroRifa[]>([]);
  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Load user numbers from API
        const numerosResponse = await fetch(`/api/numeros/user/${user.id}`);
        const userNumbers = numerosResponse.ok ? await numerosResponse.json() : [];

        // Load all sorteios from API
        const sorteiosResponse = await fetch('/api/sorteios');
        const allSorteios = sorteiosResponse.ok ? await sorteiosResponse.json() : [];

        // Load user comprovantes from API
        const comprovantesResponse = await fetch(`/api/comprovantes/user/${user.id}`);
        const userComprovantes = comprovantesResponse.ok ? await comprovantesResponse.json() : [];

        setNumbers(userNumbers);
        setSorteios(allSorteios);
        setComprovantes(userComprovantes);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, [user?.id]);

  const filteredNumbers = selectedRaffle === 'all' 
    ? numbers 
    : numbers.filter(n => n.sorteio_id === selectedRaffle);

  const currentRaffle = sorteios.find(s => s.status === 'aberto');
  const pendingVouchers = comprovantes.filter(c => c.status === 'pendente').length;

  const getStatusBadge = (sorteioId: string) => {
    const sorteio = sorteios.find(s => s.id === sorteioId);
    if (!sorteio) return { text: 'Desconhecido', color: 'gray' };
    
    if (sorteio.status === 'aberto') {
      return { text: 'Em andamento', color: 'blue' };
    } else {
      return { text: 'Finalizado', color: 'green' };
    }
  };

  const getWinningInfo = (numero: string, sorteioId: string) => {
    const sorteio = sorteios.find(s => s.id === sorteioId);
    if (!sorteio?.numeros_premiados?.includes(numero)) {
      return null;
    }

    // Find which prize this number won
    const numeroIndex = sorteio.numeros_premiados.indexOf(numero);
    let currentIndex = 0;
    
    if (sorteio.premios) {
      for (const premio of sorteio.premios.sort((a, b) => a.ordem - b.ordem)) {
        if (numeroIndex >= currentIndex && numeroIndex < currentIndex + premio.quantidade_numeros) {
          return {
            isWinner: true,
            prizeOrder: premio.ordem,
            prizeName: premio.nome,
            isPrincipal: premio.ordem === 1
          };
        }
        currentIndex += premio.quantidade_numeros;
      }
    }

    return {
      isWinner: true,
      prizeOrder: 1,
      prizeName: 'Prêmio Principal',
      isPrincipal: true
    };
  };

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Meus Números</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Visualize todos os seus números da sorte</p>
      </div>

      {pendingVouchers > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm sm:text-base">
              Você tem {pendingVouchers} comprovante{pendingVouchers > 1 ? 's' : ''} pendente{pendingVouchers > 1 ? 's' : ''} de aprovação.
              Novos números serão gerados assim que for{pendingVouchers > 1 ? 'em' : ''} aprovado{pendingVouchers > 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Hash className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{filteredNumbers.length}</span>
              <span className="text-gray-600 dark:text-gray-300 ml-1">números</span>
            </div>
          </div>
          
          {currentRaffle && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{currentRaffle.nome}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={selectedRaffle}
            onChange={(e) => setSelectedRaffle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos os sorteios</option>
            {sorteios.map(sorteio => (
              <option key={sorteio.id} value={sorteio.id}>
                {sorteio.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredNumbers.length === 0 ? (
        <div className="text-center py-12">
          <Hash className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum número encontrado</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {selectedRaffle === 'all' 
              ? 'Você ainda não possui números. Envie um comprovante para gerar seus números da sorte!'
              : 'Você não possui números neste sorteio específico.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredNumbers.map((numero) => {
            const status = getStatusBadge(numero.sorteio_id);
            const winningInfo = getWinningInfo(numero.numero_gerado, numero.sorteio_id);
            const sorteio = sorteios.find(s => s.id === numero.sorteio_id);
            
            return (
              <div
                key={numero.id}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  winningInfo?.isWinner
                    ? winningInfo.isPrincipal
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-400 dark:border-yellow-500 shadow-lg ring-2 ring-yellow-300 dark:ring-yellow-600'
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-400 dark:border-purple-500 shadow-lg ring-2 ring-purple-300 dark:ring-purple-600'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  {winningInfo?.isWinner && (
                    <div className="mb-2">
                      {winningInfo.isPrincipal ? (
                        <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mx-auto" />
                      ) : (
                        <Award className="w-5 h-5 text-purple-500 dark:text-purple-400 mx-auto" />
                      )}
                    </div>
                  )}
                  <div className={`text-lg font-bold ${
                    winningInfo?.isWinner 
                      ? winningInfo.isPrincipal
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {numero.numero_gerado}
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      status.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {status.text}
                    </span>
                  </div>
                  {sorteio && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {sorteio.nome}
                    </div>
                  )}
                  {winningInfo?.isWinner && (
                    <div className={`mt-2 text-xs font-medium ${
                      winningInfo.isPrincipal 
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-purple-700 dark:text-purple-300'
                    }`}>
                      🎉 {winningInfo.prizeName}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserNumbers;