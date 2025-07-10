// Componente comum para modais de vídeo
import { X } from 'lucide-react';
import { extractVideoUrl, formatDate } from '../../utils/formatters';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoLink: string;
  title: string;
  subtitle?: string;
  status?: string;
  endDate?: string;
  showRaffleInfo?: boolean;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoLink,
  title,
  subtitle,
  status,
  endDate,
  showRaffleInfo = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-90vh overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={extractVideoUrl(videoLink)}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
        
        {showRaffleInfo && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700">
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Sorteio:</strong> {subtitle}
              </p>
            )}
            {status && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Status:</strong> {status === 'aberto' ? 'Em andamento' : 'Finalizado'}
              </p>
            )}
            {endDate && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Finalizado em:</strong> {formatDate(endDate)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};