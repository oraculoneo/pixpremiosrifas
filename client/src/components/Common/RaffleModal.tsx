// Componente comum para modais de detalhes de sorteio
import { X, Clock, Calendar, Hash, Trophy, Play, Gift, Target } from 'lucide-react';
import { formatDate, extractVideoUrl } from '../../utils/formatters';

interface RaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: any;
  userNumbers?: any[];
  showUserNumbers?: boolean;
  showVideo?: boolean;
}

export const RaffleModal: React.FC<RaffleModalProps> = ({
  isOpen,
  onClose,
  raffle,
  userNumbers = [],
  showUserNumbers = false,
  showVideo = true
}) => {
  if (!isOpen || !raffle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-4">
            {raffle.nome}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-140px)] p-4 sm:p-6">
          <div className="space-y-6">
            {/* Banner Image */}
            {raffle.banner_image && (
              <div className="w-full">
                <img
                  src={raffle.banner_image}
                  alt={`Banner ${raffle.nome}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {raffle.status === 'aberto' ? 'Aberto' : 'Encerrado'}
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
                      {formatDate(raffle.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data do Sorteio</p>
                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                      {raffle.data_sorteio ? formatDate(raffle.data_sorteio) : 'A definir'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Números</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {raffle.total_numeros || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Número Inicial</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {raffle.numero_inicial || '1'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Número Final</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {raffle.numero_final || raffle.total_numeros || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Numbers */}
            {showUserNumbers && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-green-500" />
                  <span>Seus Números</span>
                </h4>
                
                {userNumbers.length > 0 ? (
                  <div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        🎉 Parabéns! Você tem {userNumbers.length} número(s) neste sorteio!
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {userNumbers.map((numero, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 sm:p-3 rounded-lg text-center font-bold shadow-md hover:shadow-lg transition-shadow text-sm sm:text-base"
                        >
                          {numero.numero_gerado}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200">
                      Você ainda não tem números neste sorteio. Envie um comprovante para participar!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Prizes */}
            {raffle.premios && raffle.premios.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Prêmios Definidos</span>
                </h4>
                
                <div className="space-y-3">
                  {raffle.premios.map((premio: any, index: number) => (
                    <div
                      key={premio.id}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {index + 1}° Lugar
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {premio.nome}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {showVideo && raffle.video_link && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Play className="w-5 h-5 text-red-500" />
                  <span>Vídeo do Sorteio</span>
                </h4>
                <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={extractVideoUrl(raffle.video_link)}
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
          </div>
        </div>
      </div>
    </div>
  );
};