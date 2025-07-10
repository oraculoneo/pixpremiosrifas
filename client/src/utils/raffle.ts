export const generateRaffleNumbers = (valor: number, sorteioConfig?: any): string[] => {
  // Use default values - this function should ideally receive config as parameter
  const blockValue = 100;
  const numbersPerBlock = 10;
  
  const blocosDe100 = Math.floor(valor / blockValue);
  const totalNumeros = blocosDe100 * numbersPerBlock;
  const numeros: string[] = [];
  
  // Use raffle configuration if available
  const minNum = sorteioConfig?.numero_minimo || 1;
  const maxNum = sorteioConfig?.numero_maximo || 99999;
  
  for (let i = 0; i < totalNumeros; i++) {
    let numero: string;
    
    if (maxNum <= 99999) {
      // For smaller ranges, generate within the specified range
      const randomNum = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      numero = randomNum.toString().padStart(5, '0');
    } else {
      // For larger ranges, use the original method
      numero = Math.floor(10000 + Math.random() * 90000).toString();
    }
    
    // Ensure no duplicates
    if (!numeros.includes(numero)) {
      numeros.push(numero);
    } else {
      i--; // Try again if duplicate
    }
  }
  
  return numeros;
};

// Importa as funções centralizadas de formatters
export { formatCurrency, formatDate } from './formatters';

