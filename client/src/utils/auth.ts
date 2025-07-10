export const hashPassword = (password: string): string => {
  // Simple hash simulation - in production, use bcrypt or similar
  return btoa(password + 'salt');
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const formatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(10)) !== secondDigit) return false;
  
  return true;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Formato brasileiro: (XX) 9XXXX-XXXX = 11 dígitos
  return cleanPhone.length === 11 && cleanPhone.charAt(2) === '9';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getCPFRegion = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return 'Inválido';
  
  const regionDigit = cleanCPF.charAt(8);
  
  switch (regionDigit) {
    case '1': return 'DF, GO, MS, MT, TO';
    case '2': return 'AC, AM, AP, PA, RO, RR';
    case '3': return 'CE, MA, PI';
    case '4': return 'AL, PB, PE, RN';
    case '5': return 'BA, SE';
    case '6': return 'MG';
    case '7': return 'ES, RJ';
    case '8': return 'SP';
    case '9': return 'PR, SC';
    case '0': return 'RS';
    default: return 'Região desconhecida';
  }
};