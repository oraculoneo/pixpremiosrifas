import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, XCircle, Clock, Calendar, DollarSign, Ticket, AlertCircle, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, formatDateOnly, formatTime } from '../../utils/formatters';

interface Comprovante {
  id: string;
  user_id: string;
  sorteio_id: string;
  valor_informado: string;
  valor_lido: string;
  imagem_comprovante: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  cupom_usado?: string;
  desconto_aplicado?: string;
  resposta_admin?: string;
  created_at: string;
  updated_at: string;
}

interface Sorteio {
  id: string;
  nome: string;
  status: string;
}

const UserVouchers: React.FC = () => {
  console.log('UserVouchers component is rendering');
  const { user } = useAuth();
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [sorteios, setSorteios] = useState<{ [key: string]: Sorteio }>({});
  const [userNumbers, setUserNumbers] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Comprovante | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserVouchers();
    }
  }, [user]);

  const loadUserVouchers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Iniciando carregamento de comprovantes para usuário:', user.id);
      
      // Buscar comprovantes do usuário
      const vouchersResponse = await fetch(`/api/comprovantes/user/${user.id}`);
      if (vouchersResponse.ok) {
        const userVouchers = await vouchersResponse.json();
        console.log('Comprovantes carregados:', userVouchers.length);
        console.log('Status dos comprovantes:', userVouchers.map(v => v.status));
        setComprovantes(userVouchers);

        // Buscar informações dos sorteios
        const sorteioIds = [...new Set(userVouchers.map((v: Comprovante) => v.sorteio_id))];
        const sorteiosMap: { [key: string]: Sorteio } = {};
        
        for (const sorteioId of sorteioIds) {
          try {
            const sorteioResponse = await fetch(`/api/sorteios/${sorteioId}`);
            if (sorteioResponse.ok) {
              const sorteio = await sorteioResponse.json();
              sorteiosMap[sorteioId] = sorteio;
            }
          } catch (error) {
            console.error(`Erro ao buscar sorteio ${sorteioId}:`, error);
          }
        }
        
        setSorteios(sorteiosMap);
        
        // Carregar números do usuário para cada sorteio
        const numbersMap: { [key: string]: any[] } = {};
        for (const comprovante of userVouchers) {
          if (comprovante.status === 'aprovado') {
            console.log(`Carregando números para sorteio: ${comprovante.sorteio_id}`);
            const numbers = await loadUserNumbers(comprovante.sorteio_id);
            console.log(`Números encontrados para sorteio ${comprovante.sorteio_id}:`, numbers);
            numbersMap[comprovante.sorteio_id] = numbers;
          }
        }
        console.log('Mapa final de números:', numbersMap);
        setUserNumbers(numbersMap);
      }
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserNumbers = async (sorteioId: string) => {
    try {
      const response = await fetch(`/api/numeros/user/${user?.id}`);
      if (response.ok) {
        const allNumbers = await response.json();
        console.log(`Total de números do usuário: ${allNumbers.length}`);
        const filteredNumbers = allNumbers.filter((num: any) => num.sorteio_id === sorteioId);
        console.log(`Números filtrados para sorteio ${sorteioId}:`, filteredNumbers.length);
        return filteredNumbers;
      }
    } catch (error) {
      console.error('Erro ao carregar números:', error);
    }
    return [];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejeitado':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pendente':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      case 'pendente':
      default:
        return 'Em Análise';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-500/20 text-green-400';
      case 'rejeitado':
        return 'bg-red-500/20 text-red-400';
      case 'pendente':
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gold font-medium">Carregando comprovantes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (comprovantes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhum comprovante encontrado</h2>
            <p className="text-gray-400">Você ainda não enviou nenhum comprovante de pagamento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gold mb-2">Comprovantes Enviados</h1>
          <p className="text-gray-400">Visualize todos os comprovantes que você enviou e seus status</p>
        </div>

        <div className="space-y-6">
          {comprovantes.map((comprovante) => (
            <div
              key={comprovante.id}
              className="card-modern-dark rounded-xl p-6 border border-white/10 hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gold/20 rounded-lg">
                      <Receipt className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {sorteios[comprovante.sorteio_id]?.nome || 'Sorteio não encontrado'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(comprovante.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(comprovante.status)}`}>
                          {getStatusText(comprovante.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-gray-400">Valor Informado:</span>
                      <span className="font-medium text-white">
                        {formatCurrency(Number(comprovante.valor_informado))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span className="text-gray-400">Data:</span>
                      <span className="font-medium text-white">
                        {formatDateOnly(comprovante.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold" />
                      <span className="text-gray-400">Horário:</span>
                      <span className="font-medium text-white">
                        {formatTime(comprovante.created_at)}
                      </span>
                    </div>

                    {comprovante.cupom_usado && (
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-gold" />
                        <span className="text-gray-400">Cupom:</span>
                        <span className="font-medium text-green-400">
                          {comprovante.cupom_usado}
                        </span>
                      </div>
                    )}

                    {comprovante.desconto_aplicado && Number(comprovante.desconto_aplicado) > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-gold" />
                        <span className="text-gray-400">Desconto:</span>
                        <span className="font-medium text-green-400">
                          {formatCurrency(Number(comprovante.desconto_aplicado))}
                        </span>
                      </div>
                    )}
                  </div>

                  {comprovante.status === 'aprovado' && userNumbers[comprovante.sorteio_id] && userNumbers[comprovante.sorteio_id].length > 0 && (
                    <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">Números Gerados:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userNumbers[comprovante.sorteio_id].map((numero: any, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium"
                          >
                            {numero.numero_gerado}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {comprovante.status === 'pendente' && (
                    <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Aguardando aprovação do administrador</span>
                      </div>
                    </div>
                  )}

                  {comprovante.status === 'rejeitado' && (
                    <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-medium">Comprovante rejeitado</span>
                      </div>
                      {comprovante.resposta_admin && (
                        <div className="mt-2 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                          <p className="text-sm text-gray-400 mb-1">Motivo:</p>
                          <p className="text-sm text-red-300">{comprovante.resposta_admin}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedVoucher(comprovante);
                      setShowImageModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/80 text-black rounded-lg transition-colors font-medium"
                  >
                    <Image className="w-4 h-4" />
                    <span>Ver Comprovante</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showImageModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gold/20">
              <div className="flex justify-between items-center p-6 border-b border-gold/20">
                <h3 className="text-xl font-bold text-gold">
                  Comprovante de Pagamento
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Sorteio:</span>
                      <p className="font-medium text-white">
                        {sorteios[selectedVoucher.sorteio_id]?.nome || 'Sorteio não encontrado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Valor:</span>
                      <p className="font-medium text-white">
                        {formatCurrency(Number(selectedVoucher.valor_informado))}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(selectedVoucher.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVoucher.status)}`}>
                          {getStatusText(selectedVoucher.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Enviado em:</span>
                      <p className="font-medium text-white">
                        {formatDate(selectedVoucher.created_at)} às {formatTime(selectedVoucher.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedVoucher.status === 'rejeitado' && selectedVoucher.resposta_admin && (
                  <div className="border-t border-gold/20 pt-4 mb-4">
                    <h4 className="font-medium text-red-400 mb-3">
                      Motivo da Rejeição
                    </h4>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-red-300">{selectedVoucher.resposta_admin}</p>
                    </div>
                  </div>
                )}
                
                <div className="border-t border-gold/20 pt-4">
                  <h4 className="font-medium text-gold mb-3">
                    Imagem do Comprovante
                  </h4>
                  <div className="max-h-96 overflow-auto">
                    <img
                      src={selectedVoucher.imagem_comprovante}
                      alt="Comprovante de pagamento"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
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

export default UserVouchers;