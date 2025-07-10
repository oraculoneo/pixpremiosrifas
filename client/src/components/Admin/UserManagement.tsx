import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, CreditCard, Calendar, DollarSign, Hash, Phone } from 'lucide-react';
import { User, Comprovante, NumeroRifa } from '../../types';
import { formatCurrency, formatDate } from '../../utils/raffle';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [numeros, setNumeros] = useState<NumeroRifa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar dados reais do servidor
        const [usersRes, comprovantesRes, numerosRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/comprovantes'),
          fetch('/api/numeros-rifa')
        ]);

        const allUsers: User[] = await usersRes.json();
        const allComprovantes: Comprovante[] = await comprovantesRes.json();
        const allNumeros: NumeroRifa[] = await numerosRes.json();

        // Filter out admin users
        const regularUsers = allUsers.filter(u => u.role === 'user');
        
        setUsers(regularUsers);
        setComprovantes(allComprovantes);
        setNumeros(allNumeros);
      } catch (error) {
        console.error('Erro ao carregar dados dos usuários:', error);
      }
    };

    loadData();
  }, []);

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf.includes(searchTerm) ||
    (user.telefone && user.telefone.includes(searchTerm))
  );

  const getUserStats = (userId: string) => {
    const userVouchers = comprovantes.filter(c => c.user_id === userId);
    const userNumbers = numeros.filter(n => n.user_id === userId);
    
    const totalDeposited = userVouchers.reduce((sum, c) => sum + Number(c.valor_informado || 0), 0);
    const totalApproved = userVouchers
      .filter(c => c.status === 'aprovado')
      .reduce((sum, c) => sum + Number(c.valor_informado || 0), 0);
    const pendingCount = userVouchers.filter(c => c.status === 'pendente').length;
    
    return {
      totalDeposited,
      totalApproved,
      pendingCount,
      numbersCount: userNumbers.length,
      vouchersCount: userVouchers.length
    };
  };

  const getUserDetails = (user: User) => {
    const userVouchers = comprovantes.filter(c => c.user_id === user.id);
    const userNumbers = numeros.filter(n => n.user_id === user.id);
    const stats = getUserStats(user.id);
    
    return {
      user,
      vouchers: userVouchers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      numbers: userNumbers,
      stats
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Visualize e gerencie todos os usuários do sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Buscar por nome, CPF ou telefone..."
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        {filteredUsers.map((user) => {
          const stats = getUserStats(user.id);
          return (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.cpf}</p>
                  </div>
                </div>
                {stats.pendingCount > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                    {stats.pendingCount} pendente{stats.pendingCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 flex-grow">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>{user.cpf}</span>
                </div>
                {user.telefone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{user.telefone}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Cadastro: {formatDate(user.created_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalDeposited)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Depositado</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-center mb-1">
                    <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.numbersCount}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Números</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Aprovado:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(stats.totalApproved)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Comprovantes:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.vouchersCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {searchTerm ? 'Tente ajustar os termos de busca.' : 'Nenhum usuário cadastrado ainda.'}
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes do Usuário</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {(() => {
                const details = getUserDetails(selectedUser);
                return (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                          <p className="text-gray-900 dark:text-white">{details.user.nome}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">CPF</label>
                          <p className="text-gray-900 dark:text-white">{details.user.cpf}</p>
                        </div>
                        {details.user.telefone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</label>
                            <p className="text-gray-900 dark:text-white">{details.user.telefone}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Cadastro</label>
                          <p className="text-gray-900 dark:text-white">{formatDate(details.user.created_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Depositado</label>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(details.stats.totalDeposited)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Aprovado</label>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(details.stats.totalApproved)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{details.stats.numbersCount}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Números Gerados</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{details.stats.vouchersCount}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Comprovantes</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{details.stats.pendingCount}</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vouchers History */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Histórico de Comprovantes</h4>
                      {details.vouchers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">Nenhum comprovante enviado</p>
                      ) : (
                        <div className="space-y-3">
                          {details.vouchers.map((voucher) => (
                            <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(voucher.valor_informado)}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(voucher.created_at)}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                voucher.status === 'aprovado' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                voucher.status === 'rejeitado' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }`}>
                                {voucher.status === 'aprovado' ? 'Aprovado' :
                                 voucher.status === 'rejeitado' ? 'Rejeitado' :
                                 'Pendente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;