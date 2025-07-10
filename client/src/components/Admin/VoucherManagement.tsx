import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Calendar, DollarSign, User, MessageCircle } from 'lucide-react';
import { Comprovante, NumeroRifa, Sorteio } from '../../types';
import { formatCurrency, formatDate, generateRaffleNumbers } from '../../utils/raffle';

const VoucherManagement: React.FC = () => {
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Comprovante | null>(null);
  const [filter, setFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [loading, setLoading] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<Comprovante | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [sorteios, setSorteios] = useState<{[key: string]: Sorteio}>({});

  const loadComprovantes = async () => {
    try {
      const [comprovantesRes, usersRes, sorteiosRes] = await Promise.all([
        fetch('/api/comprovantes'),
        fetch('/api/users'),
        fetch('/api/sorteios')
      ]);
      
      const comprovantesData = await comprovantesRes.json();
      const usersData = await usersRes.json();
      const sorteiosData = await sorteiosRes.json();
      
      // Create sorteios map
      const sorteiosMap = sorteiosData.reduce((acc: any, sorteio: any) => {
        acc[sorteio.id] = sorteio;
        return acc;
      }, {});
      setSorteios(sorteiosMap);
      
      // Add user names to vouchers
      const withUserNames = comprovantesData.map((c: any) => ({
        ...c,
        usuario_nome: usersData.find((u: any) => u.id === c.user_id)?.nome || 'Usuário não encontrado'
      }));
      
      setComprovantes(withUserNames);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
    }
  };

  const reloadAfterAction = async () => {
    // Quick reload after user actions
    await loadComprovantes();
  };

  useEffect(() => {
    loadComprovantes();
    const interval = setInterval(loadComprovantes, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredComprovantes = comprovantes.filter(c => 
    filter === 'all' || c.status === filter
  );

  const handleApprove = async (comprovante: Comprovante) => {
    setLoading(comprovante.id);
    
    try {
      console.log('Aprovando comprovante:', comprovante);
      console.log('Sorteio ID:', comprovante.sorteio_id);
      
      // Update voucher status
      const response = await fetch(`/api/comprovantes/${comprovante.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprovado' })
      });

      if (!response.ok) throw new Error('Erro ao aprovar comprovante');

      // Generate raffle numbers
      const numbersPayload = {
        user_id: comprovante.user_id,
        valor_comprovante: comprovante.valor_informado,
        sorteio_id: comprovante.sorteio_id,
        cupom_usado: comprovante.cupom_usado,
        desconto_aplicado: comprovante.desconto_aplicado
      };
      
      console.log('Payload para gerar números:', numbersPayload);
      
      const numbersResponse = await fetch('/api/numeros/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(numbersPayload)
      });

      if (!numbersResponse.ok) {
        console.error('Erro ao gerar números da rifa');
      }

      // Reload data
      await reloadAfterAction();
      setSelectedVoucher(null);
    } catch (error) {
      console.error('Erro ao aprovar comprovante:', error);
      alert('Erro ao aprovar comprovante');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = (comprovante: Comprovante) => {
    console.log('Abrindo modal de resposta para:', comprovante);
    setShowResponseModal(comprovante);
    setAdminResponse('');
  };

  const handleRejectWithResponse = async () => {
    if (!showResponseModal) return;
    
    setLoading(showResponseModal.id);
    
    try {
      // Update voucher status with admin response
      const response = await fetch(`/api/comprovantes/${showResponseModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejeitado',
          resposta_admin: adminResponse.trim() || 'Comprovante rejeitado pelo administrador'
        })
      });

      if (!response.ok) throw new Error('Erro ao rejeitar comprovante');

      // Reload data
      await reloadAfterAction();
      setSelectedVoucher(null);
      setShowResponseModal(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Erro ao rejeitar comprovante:', error);
      alert('Erro ao rejeitar comprovante');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Comprovantes</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Aprove ou rejeite comprovantes de pagamento</p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {[
            { key: 'pendente', label: 'Pendentes', count: comprovantes.filter(c => c.status === 'pendente').length },
            { key: 'aprovado', label: 'Aprovados', count: comprovantes.filter(c => c.status === 'aprovado').length },
            { key: 'rejeitado', label: 'Rejeitados', count: comprovantes.filter(c => c.status === 'rejeitado').length },
            { key: 'all', label: 'Todos', count: comprovantes.length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredComprovantes.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Eye className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum comprovante encontrado</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {filter === 'pendente' 
                ? 'Não há comprovantes pendentes de aprovação.'
                : `Não há comprovantes com status "${filter}".`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sorteio
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredComprovantes.map((comprovante) => (
                  <tr key={comprovante.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-24 sm:max-w-none">
                            {comprovante.usuario_nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-32 sm:max-w-none">
                        {comprovante.sorteio_id && sorteios[comprovante.sorteio_id] 
                          ? sorteios[comprovante.sorteio_id].nome 
                          : 'Sorteio não definido'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 mr-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {formatCurrency(Number(comprovante.valor_informado))}
                        </span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {formatDate(comprovante.created_at)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        comprovante.status === 'aprovado' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : comprovante.status === 'rejeitado'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {comprovante.status === 'aprovado' ? 'Aprovado' :
                         comprovante.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => setSelectedVoucher(comprovante)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"
                          title="Visualizar"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        {comprovante.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => handleApprove(comprovante)}
                              disabled={loading === comprovante.id}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 p-1"
                              title="Aprovar"
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(comprovante)}
                              disabled={loading === comprovante.id}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 p-1"
                              title="Rejeitar com resposta"
                            >
                              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Voucher Preview Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comprovante de Pagamento</h3>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuário</label>
                    <p className="text-gray-900 dark:text-white">{selectedVoucher.usuario_nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sorteio</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedVoucher.sorteio_id && sorteios[selectedVoucher.sorteio_id] 
                        ? sorteios[selectedVoucher.sorteio_id].nome 
                        : 'Sorteio não definido'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Informado</label>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(Number(selectedVoucher.valor_informado))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Envio</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedVoucher.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedVoucher.status === 'aprovado' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : selectedVoucher.status === 'rejeitado'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {selectedVoucher.status === 'aprovado' ? 'Aprovado' :
                       selectedVoucher.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Comprovante</label>
                  <img 
                    src={selectedVoucher.imagem_comprovante} 
                    alt="Comprovante" 
                    className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-600"
                  />
                </div>

                {selectedVoucher.status === 'pendente' && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      onClick={() => handleApprove(selectedVoucher)}
                      disabled={loading === selectedVoucher.id}
                      className="flex-1 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {loading === selectedVoucher.id ? 'Aprovando...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedVoucher)}
                      disabled={loading === selectedVoucher.id}
                      className="flex-1 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {loading === selectedVoucher.id ? 'Rejeitando...' : 'Rejeitar com Resposta'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rejeitar Comprovante</h3>
                <button
                  onClick={() => setShowResponseModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Usuário: {showResponseModal.usuario_nome}
                  </label>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Sorteio: {showResponseModal.sorteio_id && sorteios[showResponseModal.sorteio_id] 
                      ? sorteios[showResponseModal.sorteio_id].nome 
                      : 'Sorteio não definido'}
                  </label>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Valor: {formatCurrency(Number(showResponseModal.valor_informado))}
                  </label>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Motivo da rejeição (opcional):
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Ex: Comprovante ilegível, valor incorreto, documento inválido..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Esta mensagem será exibida ao usuário junto com o status de rejeição.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowResponseModal(null)}
                    className="flex-1 bg-gray-500 dark:bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRejectWithResponse}
                    disabled={loading === showResponseModal.id}
                    className="flex-1 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {loading === showResponseModal.id ? 'Rejeitando...' : 'Rejeitar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;