import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, Save, Palette, Upload, Eye, EyeOff, User, Edit, Trash2, X } from 'lucide-react';
import { User as UserType } from '../../types';
import { hashPassword } from '../../utils/auth';

interface SystemConfig {
  minDepositAmount: number;
  numbersPerBlock: number;
  blockValue: number;
  systemName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    minDepositAmount: 100,
    numbersPerBlock: 10,
    blockValue: 100,
    systemName: 'Sistema de Rifas',
    primaryColor: '#059669',
    secondaryColor: '#3B82F6',
    accentColor: '#F59E0B',
    logoUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load system configuration from server
        const configRes = await fetch('/api/system-config');
        if (configRes.ok) {
          const configs = await configRes.json();
          
          // Convert array of configs to object
          const configObj = configs.reduce((acc: any, config: any) => {
            acc[config.key] = config.value;
            return acc;
          }, {});

          setConfig({
            minDepositAmount: configObj.min_deposit_amount ?? 100,
            numbersPerBlock: configObj.numbers_per_block ?? 10,
            blockValue: configObj.block_value ?? 100,
            systemName: configObj.system_name ?? 'Sistema de Rifas',
            primaryColor: configObj.primary_color ?? '#059669',
            secondaryColor: configObj.secondary_color ?? '#3B82F6',
            accentColor: configObj.accent_color ?? '#F59E0B',
            logoUrl: configObj.logo_url ?? ''
          });
          
          if (configObj.logo_url) {
            setLogoPreview(configObj.logo_url);
          }

          // Apply colors immediately on load
          if (configObj.primary_color) {
            document.documentElement.style.setProperty('--primary-color', configObj.primary_color);
          }
          if (configObj.secondary_color) {
            document.documentElement.style.setProperty('--secondary-color', configObj.secondary_color);
          }
          if (configObj.accent_color) {
            document.documentElement.style.setProperty('--accent-color', configObj.accent_color);
          }
        }

        // Load users from server
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const allUsers: UserType[] = await usersRes.json();
          setUsers(allUsers.filter(u => u.role === 'user'));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save each configuration to PostgreSQL
      const configMappings = {
        'system_name': config.systemName,
        'primary_color': config.primaryColor,
        'secondary_color': config.secondaryColor,
        'accent_color': config.accentColor,
        'logo_url': config.logoUrl,
        'min_deposit_amount': config.minDepositAmount,
        'numbers_per_block': config.numbersPerBlock,
        'block_value': config.blockValue
      };

      // Save all configurations
      for (const [key, value] of Object.entries(configMappings)) {
        await fetch(`/api/system-config/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value })
        });
      }
      
      // Apply CSS custom properties for colors
      document.documentElement.style.setProperty('--primary-color', config.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', config.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', config.accentColor);
      
      // Update page title
      document.title = config.systemName;
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));

    // Apply colors immediately when changed
    if (key === 'primaryColor' || key === 'secondaryColor' || key === 'accentColor') {
      const cssVar = key === 'primaryColor' ? '--primary-color' : 
                    key === 'secondaryColor' ? '--secondary-color' : '--accent-color';
      document.documentElement.style.setProperty(cssVar, value);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        handleConfigChange('logoUrl', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (user: UserType) => {
    if (!newPassword.trim()) return;
    
    try {
      const hashedPassword = hashPassword(newPassword);
      
      // Update user password via API
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senha_hash: hashedPassword })
      });

      if (response.ok) {
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === user.id ? { ...u, senha_hash: hashedPassword } : u
        );
        setUsers(updatedUsers);
        setShowPasswordModal(null);
        setNewPassword('');
        alert('Senha alterada com sucesso!');
      } else {
        throw new Error('Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha. Tente novamente.');
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        // Delete user via API (cascade deletion will handle related data)
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Update local state
          const updatedUsers = users.filter(u => u.id !== userId);
          setUsers(updatedUsers);
          alert('Usuário excluído com sucesso!');
        } else {
          throw new Error('Erro ao excluir usuário');
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Tente novamente.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Gerencie as configurações globais do sistema de rifas</p>
      </div>

      <div className="space-y-8">
        {/* System Branding */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Identidade Visual</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Sistema
                </label>
                <input
                  type="text"
                  value={config.systemName}
                  onChange={(e) => handleConfigChange('systemName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sistema de Rifas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo do Sistema
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Logo
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor Primária
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    placeholder="#059669"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor Secundária
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => handleConfigChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => handleConfigChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor de Destaque
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Prévia das Cores</h4>
            <div className="flex space-x-4">
              <div 
                className="w-16 h-16 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                style={{ backgroundColor: config.primaryColor }}
                title="Cor Primária"
              >
                <span className="text-white font-bold text-xs">PRIM</span>
              </div>
              <div 
                className="w-16 h-16 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                style={{ backgroundColor: config.secondaryColor }}
                title="Cor Secundária"
              >
                <span className="text-white font-bold text-xs">SEC</span>
              </div>
              <div 
                className="w-16 h-16 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                style={{ backgroundColor: config.accentColor }}
                title="Cor de Destaque"
              >
                <span className="text-white font-bold text-xs">DEST</span>
              </div>
            </div>
          </div>
        </div>



        {/* Raffle Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações da Rifa</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Mínimo de Depósito (R$)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={config.minDepositAmount}
                onChange={(e) => handleConfigChange('minDepositAmount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valor mínimo que um usuário pode depositar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor do Bloco (R$)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={config.blockValue}
                onChange={(e) => handleConfigChange('blockValue', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valor de cada bloco para geração de números</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Números por Bloco
              </label>
              <input
                type="number"
                min="1"
                value={config.numbersPerBlock}
                onChange={(e) => handleConfigChange('numbersPerBlock', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quantos números são gerados por bloco</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Exemplo de Cálculo</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Com as configurações atuais: R$ {config.blockValue.toFixed(2)} = {config.numbersPerBlock} números
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Um depósito de R$ {(config.blockValue * 2).toFixed(2)} geraria {config.numbersPerBlock * 2} números
            </p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Usuários</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.cpf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.telefone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setShowPasswordModal(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Alterar senha"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors ${
              saved 
                ? 'bg-green-600 dark:bg-green-500 text-white'
                : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white disabled:opacity-50'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alterar Senha - {showPasswordModal.nome}
                </h3>
                <button
                  onClick={() => setShowPasswordModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowPasswordModal(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePasswordChange(showPasswordModal)}
                    disabled={!newPassword.trim()}
                    className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Alterar Senha
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

export default SystemSettings;