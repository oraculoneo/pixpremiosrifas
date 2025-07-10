import React, { useState, useEffect } from 'react';
import { Hash, Users, CheckCircle, XCircle, Award, Search, Filter, Eye, Crown, Star } from 'lucide-react';
import { NumeroRifa, Sorteio, User as UserType } from '../../types';
import { formatDate } from '../../utils/raffle';

interface RaffleNumberManagementProps {
  sorteio: Sorteio;
  onClose: () => void;
}

const RaffleNumberManagement: React.FC<RaffleNumberManagementProps> = ({ sorteio, onClose }) => {
  const [numbers, setNumbers] = useState<NumeroRifa[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'available'>('all');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeType, setPrizeType] = useState<'principal' | 'secondary'>('principal');

  useEffect(() => {
    loadData();
  }, [sorteio.id]);

  const loadData = async () => {
    try {
      // Load numbers from API
      const numbersResponse = await fetch(`/api/numeros-rifa?sorteio_id=${sorteio.id}`);
      if (numbersResponse.ok) {
        const allNumbers: NumeroRifa[] = await numbersResponse.json();
        const raffleNumbers = allNumbers.filter(n => n.id_sorteio === sorteio.id);
        setNumbers(raffleNumbers);
      }

      // Load users from API
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const allUsers: UserType[] = await usersResponse.json();
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Generate all possible numbers for this raffle
  const generateAllPossibleNumbers = (): string[] => {
    const config = sorteio.configuracao;
    if (!config) return [];

    const allNumbers: string[] = [];
    const min = config.numero_minimo;
    const max = config.numero_maximo;
    
    for (let i = min; i <= Math.min(max, min + config.total_numeros - 1); i++) {
      allNumbers.push(i.toString().padStart(5, '0'));
    }
    
    return allNumbers;
  };

  const allPossibleNumbers = generateAllPossibleNumbers();
  const assignedNumbers = numbers.map(n => n.numero_gerado);
  const availableNumbers = allPossibleNumbers.filter(n => !assignedNumbers.includes(n));

  const getFilteredNumbers = () => {
    let numbersToShow: Array<{numero: string, user?: UserType, isAssigned: boolean}> = [];

    if (filterStatus === 'all' || filterStatus === 'assigned') {
      const assigned = numbers.map(n => ({
        numero: n.numero_gerado,
        user: users.find(u => u.id === n.id_usuario),
        isAssigned: true
      }));
      numbersToShow = [...numbersToShow, ...assigned];
    }

    if (filterStatus === 'all' || filterStatus === 'available') {
      const available = availableNumbers.map(n => ({
        numero: n,
        isAssigned: false
      }));
      numbersToShow = [...numbersToShow, ...available];
    }

    if (searchTerm) {
      numbersToShow = numbersToShow.filter(item => 
        item.numero.includes(searchTerm) ||
        (item.user && item.user.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return numbersToShow.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
  };

  const handleNumberSelect = (numero: string) => {
    setSelectedNumbers(prev => 
      prev.includes(numero) 
        ? prev.filter(n => n !== numero)
        : [...prev, numero]
    );
  };

  const handleSelectAll = () => {
    const filteredNumbers = getFilteredNumbers();
    const allNumbers = filteredNumbers.map(item => item.numero);
    setSelectedNumbers(allNumbers);
  };

  const handleClearSelection = () => {
    setSelectedNumbers([]);
  };

  const handleSetWinners = async () => {
    if (selectedNumbers.length === 0) return;

    try {
      // Update raffle with winning numbers via API
      const response = await fetch(`/api/sorteios/${sorteio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numeros_premiados: selectedNumbers,
          status: 'encerrado',
          data_fim: new Date().toISOString()
        })
      });

      if (response.ok) {
        setShowPrizeModal(false);
        setSelectedNumbers([]);
        alert(`${selectedNumbers.length} números foram definidos como ganhadores!`);
        onClose();
      } else {
        throw new Error('Erro ao definir vencedores');
      }
    } catch (error) {
      console.error('Erro ao definir vencedores:', error);
      alert('Erro ao definir vencedores. Tente novamente.');
    }
  };

  const filteredNumbers = getFilteredNumbers();
  const stats = {
    total: allPossibleNumbers.length,
    assigned: assignedNumbers.length,
    available: availableNumbers.length,
    participants: new Set(numbers.map(n => n.id_usuario)).size
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-90vh overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Números - {sorteio.nome}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Acompanhe e gerencie todos os números desta rifa
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total de Números</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.assigned}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Números Entregues</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Disponíveis</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.participants}</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Participantes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Buscar número ou usuário..."
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos os números</option>
                  <option value="assigned">Apenas entregues</option>
                  <option value="available">Apenas disponíveis</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedNumbers.length > 0 && (
                <>
                  <button
                    onClick={() => setShowPrizeModal(true)}
                    className="flex items-center space-x-2 bg-yellow-600 dark:bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span>Definir como Ganhadores ({selectedNumbers.length})</span>
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Limpar Seleção
                  </button>
                </>
              )}
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Selecionar Todos
              </button>
            </div>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
            {filteredNumbers.map((item) => {
              const isSelected = selectedNumbers.includes(item.numero);
              const isWinner = sorteio.numeros_premiados?.includes(item.numero);
              
              return (
                <div
                  key={item.numero}
                  onClick={() => handleNumberSelect(item.numero)}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isWinner
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-300 dark:ring-yellow-600'
                      : isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600'
                      : item.isAssigned
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {isWinner && (
                    <div className="absolute -top-1 -right-1">
                      <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className={`text-sm font-bold ${
                      isWinner
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : item.isAssigned
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.numero}
                    </div>
                    
                    {item.isAssigned && item.user && (
                      <div className="mt-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate" title={item.user.nome}>
                          {item.user.nome.split(' ')[0]}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-1">
                      <span className={`px-1 py-0.5 text-xs rounded-full ${
                        isWinner
                          ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                          : item.isAssigned
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {isWinner ? 'Ganhador' : item.isAssigned ? 'Entregue' : 'Livre'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredNumbers.length === 0 && (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum número encontrado</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ajuste os filtros ou termos de busca para ver os números.
              </p>
            </div>
          )}
        </div>

        {/* Prize Modal */}
        {showPrizeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Definir Números Ganhadores
                  </h3>
                  <button
                    onClick={() => setShowPrizeModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-center mb-2">
                      <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">
                        Números Selecionados: {selectedNumbers.length}
                      </span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {selectedNumbers.slice(0, 10).join(', ')}
                      {selectedNumbers.length > 10 && ` e mais ${selectedNumbers.length - 10}...`}
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Atenção:</strong> Esta ação irá finalizar o sorteio e definir os números ganhadores. 
                      Esta operação não pode ser desfeita.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowPrizeModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSetWinners}
                      className="flex-1 bg-yellow-600 dark:bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                    >
                      Confirmar Ganhadores
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaffleNumberManagement;