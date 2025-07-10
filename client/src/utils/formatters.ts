// Utilitários de formatação para evitar duplicação de código

/**
 * Formata uma data para exibição em português brasileiro
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata apenas a data (sem horário)
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata apenas o horário
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Extrai URL do vídeo de um iframe HTML
 */
export const extractVideoUrl = (iframe: string): string => {
  if (!iframe || typeof iframe !== 'string') {
    return '';
  }
  
  try {
    const srcMatch = iframe.match(/src="([^"]+)"/);
    return srcMatch && srcMatch[1] ? srcMatch[1] : '';
  } catch (error) {
    console.error('Erro ao extrair URL do vídeo:', error);
    return '';
  }
};

/**
 * Formata valores monetários em Real brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata números com separador de milhares
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};