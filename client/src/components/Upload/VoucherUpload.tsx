import React, { useState, useEffect } from 'react';
import { Upload, Image, DollarSign, AlertCircle, CheckCircle, Clock, Ticket, Loader, Trophy, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, generateRaffleNumbers } from '../../utils/raffle';
import { Comprovante, NumeroRifa, Sorteio, Cupom } from '../../types';
import exemploComprovanteImage from '../../assets/exemplo-comprovante.png';

const VoucherUpload: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    valor: '',
    imagem: null as File | null,
    cupom: '',
    sorteio_id: ''
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [systemConfig, setSystemConfig] = useState({
    minDepositAmount: 100,
    blockValue: 100,
    numbersPerBlock: 10
  });
  const [cupomValidation, setCupomValidation] = useState<{
    valid: boolean;
    cupom?: Cupom;
    message: string;
  } | null>(null);
  const [activeRaffles, setActiveRaffles] = useState<Sorteio[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    loadSystemConfig();
    loadActiveRaffles();
  }, []);

  const loadActiveRaffles = async () => {
    try {
      const response = await fetch('/api/sorteios/ativos');
      if (response.ok) {
        const raffles = await response.json();
        setActiveRaffles(raffles);
        // Auto-select first raffle if only one exists
        if (raffles.length === 1) {
          setFormData(prev => ({ ...prev, sorteio_id: raffles[0].id }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sorteios ativos:', error);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config');
      if (response.ok) {
        const configs = await response.json();
        const configMap = configs.reduce((acc: any, config: any) => {
          acc[config.key] = config.value;
          return acc;
        }, {});
        
        setSystemConfig({
          minDepositAmount: configMap.min_deposit_amount || 100,
          blockValue: configMap.block_value || 100,
          numbersPerBlock: configMap.numbers_per_block || 10
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
      // Fallback para valores padrão
      setSystemConfig({
        minDepositAmount: 100,
        blockValue: 100,
        numbersPerBlock: 10
      });
    }
  };

  const validateCoupon = async (codigo: string) => {
    if (!codigo.trim()) {
      setCupomValidation(null);
      return;
    }

    try {
      const response = await fetch(`/api/cupons/${codigo}`);
      if (!response.ok) {
        setCupomValidation({
          valid: false,
          message: 'Cupom não encontrado'
        });
        return;
      }

      const cupom = await response.json();

      if (!cupom.ativo) {
        setCupomValidation({
          valid: false,
          message: 'Cupom inativo'
        });
        return;
      }

      if (cupom.data_expiracao && new Date(cupom.data_expiracao) < new Date()) {
        setCupomValidation({
          valid: false,
          message: 'Cupom expirado'
        });
        return;
      }

      if (cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo) {
        setCupomValidation({
          valid: false,
          message: 'Cupom esgotado'
        });
        return;
      }

      setCupomValidation({
        valid: true,
        cupom,
        message: `+${Number(cupom.valor) || 0} números extras`
      });
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setCupomValidation({
        valid: false,
        message: 'Erro ao validar cupom'
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({...formData, imagem: file});
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valor || !formData.imagem || !user || !formData.sorteio_id) return;

    setLoading(true);
    setMessage({ type: 'info', text: 'Processando comprovante...' });

    try {
      let valor = parseFloat(formData.valor);
      let descontoAplicado = 0;
      let cupomUsado = '';
      let bonusNumbers = 0;

      // Apply coupon if valid
      if (cupomValidation?.valid && cupomValidation.cupom) {
        const cupom = cupomValidation.cupom;
        cupomUsado = cupom.codigo;
        bonusNumbers = Number(cupom.valor) || 0;

        // Cupom usage will be updated automatically when the voucher is approved by admin
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        setMessage({ type: 'info', text: 'Processando comprovante...' });
        
        // Create comprovante via API
        const comprovanteData = {
          user_id: user.id,
          sorteio_id: formData.sorteio_id,
          valor_informado: parseFloat(formData.valor),
          valor_lido: parseFloat(formData.valor),
          imagem_comprovante: base64,
          status: 'pendente',
          cupom_usado: cupomUsado || null,
          desconto_aplicado: cupomUsado ? descontoAplicado : null
        };

        // Save comprovante to API
        const response = await fetch('/api/comprovantes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comprovanteData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Verificar se é erro de números insuficientes
          if (errorData.error === 'Números insuficientes no sorteio' && errorData.details) {
            setMessage({ 
              type: 'error', 
              text: errorData.details.message 
            });
            setLoading(false);
            return;
          }
          
          // Outros erros específicos
          if (errorData.error) {
            setMessage({ 
              type: 'error', 
              text: errorData.error
            });
            setLoading(false);
            return;
          }
          
          throw new Error('Erro ao salvar comprovante');
        }

        const comprovante = await response.json();
        
        let successMessage = 'Comprovante enviado com sucesso! Aguarde a aprovação da administração.';
        if (cupomUsado) {
          successMessage += ` Cupom ${cupomUsado} aplicado com sucesso!`;
        }
        
        setMessage({ 
          type: 'success', 
          text: successMessage
        });

        setFormData({ valor: '', imagem: null, cupom: '', sorteio_id: activeRaffles.length === 1 ? activeRaffles[0].id : '' });
        setPreview(null);
        setCupomValidation(null);
      };
      
      reader.readAsDataURL(formData.imagem);
    } catch (error) {
      console.error('Error processing voucher:', error);
      setMessage({ type: 'error', text: 'Erro ao processar comprovante. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateNumbers = (valor: string) => {
    const valorNum = parseFloat(valor) || 0;
    let finalValue = valorNum;

    // Apply coupon discount
    if (cupomValidation?.valid && cupomValidation.cupom?.tipo === 'percentual') {
      const desconto = valorNum * (Number(cupomValidation.cupom.valor) / 100);
      finalValue = valorNum - desconto;
    }

    const blocks = Math.floor(finalValue / systemConfig.blockValue);
    let totalNumbers = blocks * systemConfig.numbersPerBlock;

    // Add bonus numbers from coupon
    if (cupomValidation?.valid && cupomValidation.cupom?.tipo === 'quantidade') {
      totalNumbers += Number(cupomValidation.cupom.valor) || 0;
    }

    return { totalNumbers, finalValue, discount: valorNum - finalValue };
  };

  const numbersInfo = calculateNumbers(formData.valor);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Enviar Comprovante</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Faça upload do comprovante de pagamento para gerar seus números</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor Depositado
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min={systemConfig.minDepositAmount}
                value={formData.valor}
                onChange={(e) => setFormData({...formData, valor: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0,00"
                disabled={loading}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 space-y-1 sm:space-y-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Valor mínimo: {formatCurrency(systemConfig.minDepositAmount)} • Cada {formatCurrency(systemConfig.blockValue)} = {systemConfig.numbersPerBlock} números
              </p>
              {formData.valor && (
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                  {numbersInfo.discount > 0 && (
                    <div className="text-blue-600 dark:text-blue-400">
                      Desconto: {formatCurrency(numbersInfo.discount)}
                    </div>
                  )}
                  <div>= {numbersInfo.totalNumbers} números</div>
                </div>
              )}
            </div>
          </div>

          {/* Seleção de Sorteio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sorteio
            </label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                value={formData.sorteio_id}
                onChange={(e) => setFormData({...formData, sorteio_id: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
                required
              >
                <option value="">Selecione o sorteio</option>
                {activeRaffles.map(raffle => (
                  <option key={raffle.id} value={raffle.id}>
                    {raffle.nome} - {raffle.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </option>
                ))}
              </select>
            </div>
            {activeRaffles.length === 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Nenhum sorteio ativo encontrado. Entre em contato com o administrador.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cupom de Desconto (opcional)
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={formData.cupom}
                onChange={(e) => {
                  setFormData({...formData, cupom: e.target.value});
                  validateCoupon(e.target.value);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite o código do cupom"
                disabled={loading}
              />
            </div>
            {cupomValidation && (
              <div className={`mt-2 p-2 rounded-md text-sm ${
                cupomValidation.valid 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
              }`}>
                {cupomValidation.message}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Comprovante de Pagamento
              </label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Como deve ser?</span>
              </button>
            </div>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-green-400 dark:hover:border-green-500 transition-colors">
              <div className="space-y-1 text-center">
                {preview ? (
                  <div className="mb-4">
                    <img src={preview} alt="Preview" className="max-w-full max-h-48 mx-auto rounded" />
                  </div>
                ) : (
                  <Image className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                )}
                <div className="flex text-sm text-gray-600 dark:text-gray-300">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                  >
                    <span>{preview ? 'Alterar imagem' : 'Selecionar arquivo'}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                      disabled={loading}
                      required
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG até 10MB</p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' :
              message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' :
              'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />}
                {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />}
                {message.type === 'info' && <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />}
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-700 dark:text-green-300' :
                  message.type === 'error' ? 'text-red-700 dark:text-red-300' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.valor || !formData.imagem}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Enviar Comprovante</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 lg:mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">Como funciona?</h3>
        <ul className="space-y-2 text-blue-700 dark:text-blue-300">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-sm sm:text-base">Cada {formatCurrency(systemConfig.blockValue)} depositados geram {systemConfig.numbersPerBlock} números únicos</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-sm sm:text-base">Use cupons para ganhar números extras ou descontos</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-sm sm:text-base">O comprovante é validado automaticamente por IA</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-sm sm:text-base">Números são gerados instantaneamente após aprovação</span>
          </li>
        </ul>
      </div>

      {/* Modal de Ajuda */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exemplo de Comprovante
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <img 
                  src={exemploComprovanteImage} 
                  alt="Exemplo de comprovante de depósito" 
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <h4 className="font-medium text-gray-900 dark:text-white">O comprovante deve conter:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Valor exato do depósito realizado</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Data e horário da transação</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Status "Aprovado" ou "Concluído"</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Informações da conta de destino</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    💡 Dica: Capture a tela inteira do comprovante para garantir que todas as informações estejam visíveis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherUpload;