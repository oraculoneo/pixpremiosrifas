import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Calendar, Users, Play, X, Link, Settings, Dice1, Globe, Edit, Hash, Award, Trash2, Crown, User, Upload, Image, Clock } from 'lucide-react';
import { Sorteio, NumeroRifa, User as UserType, Premio } from '../../types';
import { formatDate } from '../../utils/raffle';

const RaffleManagement: React.FC = () => {
  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [allNumbers, setAllNumbers] = useState<NumeroRifa[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState<Sorteio | null>(null);
  const [showResultModal, setShowResultModal] = useState<Sorteio | null>(null);
  const [showWinnersModal, setShowWinnersModal] = useState<Sorteio | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Sorteio | null>(null);
  const [showEditModal, setShowEditModal] = useState<Sorteio | null>(null);
  const [resultType, setResultType] = useState<'manual' | 'auto' | 'federal'>('auto');
  const [manualNumbers, setManualNumbers] = useState('');
  const [newRaffle, setNewRaffle] = useState({
    nome: '',
    video_link: '',
    data_sorteio: '',
    banner_image: '',
    total_numeros: 1000,
    numero_minimo: 1,
    numero_maximo: 1000
  });
  const [premios, setPremios] = useState<Premio[]>([
    { id: '1', nome: 'Prêmio Principal', quantidade_numeros: 1, ordem: 1 }
  ]);
  const [editPremios, setEditPremios] = useState<Premio[]>([]);
  const [editRaffle, setEditRaffle] = useState({
    nome: '',
    video_link: '',
    data_sorteio: '',
    banner_image: '',
    total_numeros: 1000,
    numero_minimo: 1,
    numero_maximo: 1000
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all data in parallel
      const [sorteiosRes, numbersRes, usersRes] = await Promise.all([
        fetch('/api/sorteios'),
        fetch('/api/numeros-rifa'),
        fetch('/api/users')
      ]);

      if (sorteiosRes.ok) {
        const sorteiosData = await sorteiosRes.json();
        setSorteios(sorteiosData);
      }

      if (numbersRes.ok) {
        const numbersData = await numbersRes.json();
        setAllNumbers(numbersData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadSorteios = async () => {
    try {
      const response = await fetch('/api/sorteios');
      if (response.ok) {
        const data = await response.json();
        setSorteios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar sorteios:', error);
    }
  };

  const addPremio = () => {
    const newPremio: Premio = {
      id: Date.now().toString(),
      nome: `Prêmio ${premios.length + 1}`,
      quantidade_numeros: 1,
      ordem: premios.length + 1
    };
    setPremios([...premios, newPremio]);
  };

  const removePremio = (id: string) => {
    if (premios.length > 1) {
      setPremios(premios.filter(p => p.id !== id));
    }
  };

  const updatePremio = (id: string, field: keyof Premio, value: any) => {
    setPremios(premios.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const createRaffle = async () => {
    if (!newRaffle.nome.trim()) return;

    // Validate number configuration
    if (newRaffle.numero_minimo >= newRaffle.numero_maximo) {
      alert('O número mínimo deve ser menor que o número máximo');
      return;
    }

    if (newRaffle.total_numeros > (newRaffle.numero_maximo - newRaffle.numero_minimo + 1)) {
      alert('O total de números não pode ser maior que o intervalo disponível');
      return;
    }

    setIsCreating(true);
    
    try {
      // Validate and format date
      let dataSorteio = null;
      if (newRaffle.data_sorteio && newRaffle.data_sorteio.trim()) {
        const dateObj = new Date(newRaffle.data_sorteio);
        if (!isNaN(dateObj.getTime())) {
          dataSorteio = dateObj.toISOString();
        }
      }

      const sorteioData = {
        nome: newRaffle.nome.trim(),
        video_link: newRaffle.video_link.trim() ? convertToIframe(newRaffle.video_link.trim()) : null,
        data_sorteio: dataSorteio,
        banner_image: newRaffle.banner_image.trim() || null,
        configuracao: {
          total_numeros: newRaffle.total_numeros,
          numero_minimo: newRaffle.numero_minimo,
          numero_maximo: newRaffle.numero_maximo
        },
        premios: premios.map((p, index) => ({ ...p, ordem: index + 1 }))
      };

      const response = await fetch('/api/sorteios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sorteioData),
      });

      if (response.ok) {
        // Fechar modal imediatamente e limpar form
        setNewRaffle({ 
          nome: '', 
          video_link: '',
          data_sorteio: '',
          banner_image: '',
          total_numeros: 1000,
          numero_minimo: 1,
          numero_maximo: 1000
        });
        setPremios([{ id: '1', nome: 'Prêmio Principal', quantidade_numeros: 1, ordem: 1 }]);
        setShowCreateModal(false);
        
        // Recarregar a lista em background
        loadSorteios();
        
        alert('Sorteio criado com sucesso!');
      } else {
        const errorData = await response.json();
        alert('Erro ao criar sorteio: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar sorteio:', error);
      alert('Erro ao criar sorteio. Verifique os dados e tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Erro ao ler arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 3MB - considerando expansão base64)
    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 3MB');
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await handleImageUpload(file);
      setNewRaffle({...newRaffle, banner_image: base64});
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const convertToIframe = (url: string): string => {
    // Convert YouTube URL to embed format
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    return `<iframe width="560" height="315" src="${embedUrl}?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  };

  const finishRaffle = (sorteio: Sorteio) => {
    setShowResultModal(sorteio);
  };

  const processRaffleResult = async () => {
    if (!showResultModal) return;

    try {
      // Load numbers from API
      const numbersResponse = await fetch(`/api/numeros/sorteio/${showResultModal.id}`);
      const raffleNumbers: NumeroRifa[] = numbersResponse.ok ? await numbersResponse.json() : [];
      
      if (raffleNumbers.length === 0) {
        alert('Este sorteio não possui números para sortear.');
        return;
      }

      let winningNumbers: string[] = [];

      if (resultType === 'manual') {
        winningNumbers = manualNumbers.split(',').map(n => n.trim()).filter(n => n);
        if (winningNumbers.length === 0) {
          alert('Digite pelo menos um número vencedor.');
          return;
        }
      } else if (resultType === 'auto') {
        // Automatic draw based on prizes configuration
        const totalWinners = showResultModal.premios?.reduce((sum, p) => sum + p.quantidade_numeros, 0) || 1;
        const winningCount = Math.min(totalWinners, raffleNumbers.length);
        const shuffled = [...raffleNumbers].sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, winningCount);
        winningNumbers = winners.map(w => w.numero_gerado);
      } else if (resultType === 'federal') {
        // Simulate federal lottery scraping
        const totalWinners = showResultModal.premios?.reduce((sum, p) => sum + p.quantidade_numeros, 0) || 1;
        winningNumbers = generateFederalNumbers(totalWinners);
      }

      const winnerId = raffleNumbers.find(n => winningNumbers.includes(n.numero_gerado))?.user_id;

      const updatedSorteio = {
        ...showResultModal,
        status: 'encerrado',
        data_fim: new Date().toISOString(),
        ganhador_id: winnerId,
        numeros_premiados: winningNumbers
      };

      // Update sorteio via API
      const response = await fetch(`/api/sorteios/${showResultModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSorteio)
      });

      if (response.ok) {
        // Reload data to ensure synchronization
        loadSorteios();
        setShowResultModal(null);
        setManualNumbers('');
      } else {
        const error = await response.json();
        alert('Erro ao finalizar sorteio: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao processar resultado:', error);
      alert('Erro ao processar resultado. Tente novamente.');
    }
  };

  const generateFederalNumbers = (count: number): string[] => {
    // Simulate federal lottery numbers
    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(10000 + Math.random() * 90000).toString());
    }
    return numbers;
  };

  const updateVideoLink = async (sorteio: Sorteio, videoLink: string) => {
    try {
      const iframeCode = videoLink.trim() ? convertToIframe(videoLink.trim()) : undefined;

      const updatedSorteio = { ...sorteio, video_link: iframeCode };
      
      // Update sorteio via API
      const response = await fetch(`/api/sorteios/${sorteio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSorteio)
      });

      if (response.ok) {
        // Reload data to ensure synchronization
        loadSorteios();
        setShowVideoModal(null);
      } else {
        const error = await response.json();
        alert('Erro ao atualizar link do vídeo: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar vídeo:', error);
      alert('Erro ao atualizar vídeo. Tente novamente.');
    }
  };

  const deleteRaffle = async (sorteio: Sorteio) => {
    try {
      const response = await fetch(`/api/sorteios/${sorteio.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        const updatedSorteios = sorteios.filter(s => s.id !== sorteio.id);
        setSorteios(updatedSorteios);
        setShowDeleteModal(null);
        
        // Reload data to ensure synchronization
        loadSorteios();
      } else {
        const error = await response.json();
        alert('Erro ao excluir sorteio: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao excluir sorteio:', error);
      alert('Erro ao excluir sorteio. Tente novamente.');
    }
  };

  const openEditModal = (sorteio: Sorteio) => {
    // Populate edit form with current sorteio data
    setEditRaffle({
      nome: sorteio.nome,
      video_link: sorteio.video_link || '',
      data_sorteio: sorteio.data_sorteio ? new Date(sorteio.data_sorteio).toISOString().slice(0, 16) : '',
      banner_image: sorteio.banner_image || '',
      total_numeros: sorteio.configuracao?.total_numeros || 1000,
      numero_minimo: sorteio.configuracao?.numero_minimo || 1,
      numero_maximo: sorteio.configuracao?.numero_maximo || 1000
    });
    
    // Set edit prizes
    if (sorteio.premios && sorteio.premios.length > 0) {
      setEditPremios(sorteio.premios.map(p => ({...p})));
    } else {
      setEditPremios([{ id: '1', nome: 'Prêmio Principal', quantidade_numeros: 1, ordem: 1 }]);
    }
    
    setShowEditModal(sorteio);
  };

  const updateRaffle = async () => {
    if (!showEditModal || !editRaffle.nome.trim()) {
      alert('Nome do sorteio é obrigatório');
      return;
    }

    try {
      // Validar e formatar data com logs detalhados
      let dataSorteio = null;
      console.log('Data original do formulário:', editRaffle.data_sorteio);
      
      if (editRaffle.data_sorteio && editRaffle.data_sorteio.trim()) {
        const dateObj = new Date(editRaffle.data_sorteio);
        console.log('Objeto Date criado:', dateObj);
        console.log('É data válida?', !isNaN(dateObj.getTime()));
        
        if (!isNaN(dateObj.getTime())) {
          dataSorteio = dateObj.toISOString();
          console.log('Data formatada como ISO:', dataSorteio);
        }
      }
      
      console.log('Data final a ser enviada:', dataSorteio);

      const updateData = {
        nome: editRaffle.nome.trim(),
        video_link: editRaffle.video_link ? convertToIframe(editRaffle.video_link) : null,
        data_sorteio: dataSorteio,
        banner_image: editRaffle.banner_image || null,
        configuracao: {
          total_numeros: editRaffle.total_numeros,
          numero_minimo: editRaffle.numero_minimo,
          numero_maximo: editRaffle.numero_maximo,
          numeros_por_usuario: Math.floor(editRaffle.total_numeros / 10) // Default calculation
        },
        premios: editPremios.map((premio, index) => ({
          ...premio,
          ordem: index + 1,
          sorteio_id: showEditModal.id
        }))
      };

      const response = await fetch(`/api/sorteios/${showEditModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowEditModal(null);
        loadSorteios(); // Reload to get updated data
        
        // Reset form
        setEditRaffle({
          nome: '',
          video_link: '',
          data_sorteio: '',
          banner_image: '',
          total_numeros: 1000,
          numero_minimo: 1,
          numero_maximo: 1000
        });
        setEditPremios([]);
      } else {
        const error = await response.json();
        alert('Erro ao atualizar sorteio: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar sorteio:', error);
      alert('Erro ao atualizar sorteio. Tente novamente.');
    }
  };

  const addEditPremio = () => {
    const newPremio: Premio = {
      id: Date.now().toString(),
      nome: `Prêmio ${editPremios.length + 1}`,
      quantidade_numeros: 1,
      ordem: editPremios.length + 1
    };
    setEditPremios([...editPremios, newPremio]);
  };

  const updateEditPremio = (id: string, field: string, value: any) => {
    setEditPremios(editPremios.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeEditPremio = (id: string) => {
    if (editPremios.length > 1) {
      setEditPremios(editPremios.filter(p => p.id !== id));
    }
  };

  const handleEditBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 3MB');
        return;
      }
      
      setUploadingImage(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setEditRaffle({...editRaffle, banner_image: base64});
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRaffleStats = (sorteio: Sorteio) => {
    // Use pre-loaded data from effect
    const raffleNumbers = allNumbers.filter(n => n.sorteio_id === sorteio.id);
    const uniqueUsers = new Set(raffleNumbers.map(n => n.user_id));
    
    return {
      totalNumbers: raffleNumbers.length,
      participants: uniqueUsers.size
    };
  };

  const getWinnerDetails = (sorteio: Sorteio) => {
    if (!sorteio.numeros_premiados || sorteio.numeros_premiados.length === 0) return [];

    // Use pre-loaded data from effect
    const winnerDetails = sorteio.numeros_premiados.map((numero, index) => {
      const numeroRifa = allNumbers.find(n => n.numero_gerado === numero && n.sorteio_id === sorteio.id);
      const user = numeroRifa ? allUsers.find(u => u.id === numeroRifa.user_id) : null;
      
      // Determine which prize this number belongs to
      let currentIndex = 0;
      let prizeName = 'Prêmio Principal';
      let isPrincipal = true;
      
      if (sorteio.premios) {
        for (const premio of sorteio.premios.sort((a, b) => a.ordem - b.ordem)) {
          if (index >= currentIndex && index < currentIndex + premio.quantidade_numeros) {
            prizeName = premio.nome;
            isPrincipal = premio.ordem === 1;
            break;
          }
          currentIndex += premio.quantidade_numeros;
        }
      }
      
      return {
        numero,
        user,
        prizeName,
        isPrincipal
      };
    });

    return winnerDetails;
  };

  return (
    <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="mb-6 lg:mb-8 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Sorteios</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Crie novos sorteios e gerencie os existentes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Novo Sorteio</span>
        </button>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {sorteios.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum sorteio criado</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Crie seu primeiro sorteio para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              Criar Sorteio
            </button>
          </div>
        ) : (
          sorteios.map((sorteio) => {
            const stats = getRaffleStats(sorteio);
            const winnerDetails = getWinnerDetails(sorteio);
            return (
              <div
                key={sorteio.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-4 sm:p-6 ${
                  sorteio.status === 'aberto' ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        sorteio.status === 'aberto' ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          sorteio.status === 'aberto' ? 'text-green-700 dark:text-green-200' : 'text-gray-600 dark:text-gray-300'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold truncate ${
                          sorteio.status === 'aberto' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          {sorteio.nome}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Início: {formatDate(sorteio.data_inicio)}
                          </div>
                          {sorteio.data_fim && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Fim: {formatDate(sorteio.data_fim)}
                            </div>
                          )}
                          {sorteio.data_sorteio && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Sorteio: {formatDate(sorteio.data_sorteio)}
                            </div>
                          )}
                        </div>
                      </div>
                      {sorteio.banner_image && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={sorteio.banner_image}
                            alt={`Banner do ${sorteio.nome}`}
                            className="w-16 h-12 sm:w-20 sm:h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Raffle Configuration Display */}
                    {sorteio.configuracao && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Configuração do Sorteio</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center">
                            <Hash className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
                            <span className="text-gray-600 dark:text-gray-300">Total: {sorteio.configuracao.total_numeros}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-300">Min: {sorteio.configuracao.numero_minimo}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-300">Max: {sorteio.configuracao.numero_maximo}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-300">Por usuário: {sorteio.configuracao.numeros_por_usuario}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prizes Display */}
                    {sorteio.premios && sorteio.premios.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          Prêmios Configurados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {sorteio.premios.map((premio) => (
                            <div key={premio.id} className="text-xs bg-yellow-100 dark:bg-yellow-800 p-2 rounded">
                              <span className="font-medium text-yellow-800 dark:text-yellow-200">{premio.nome}</span>
                              <span className="text-yellow-600 dark:text-yellow-300 ml-1">
                                ({premio.quantidade_numeros} número{premio.quantidade_numeros > 1 ? 's' : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                      <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border dark:border-gray-600">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 mr-1 sm:mr-2" />
                          <div>
                            <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{stats.participants}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Participantes</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border dark:border-gray-600">
                        <div className="flex items-center">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 dark:text-green-400 mr-1 sm:mr-2" />
                          <div>
                            <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{stats.totalNumbers}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Números</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border dark:border-gray-600">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sorteio.status === 'aberto' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {sorteio.status === 'aberto' ? 'Em Andamento' : 'Finalizado'}
                        </span>
                      </div>
                      {winnerDetails.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 sm:p-3 rounded border border-yellow-200 dark:border-yellow-700">
                          <button
                            onClick={() => setShowWinnersModal(sorteio)}
                            className="w-full text-left"
                          >
                            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Ganhadores:</p>
                            <div className="flex flex-wrap gap-1">
                              {winnerDetails.slice(0, 2).map((winner, i) => (
                                <span key={i} className={`px-1 py-0.5 text-xs rounded ${
                                  winner.isPrincipal
                                    ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                    : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                                }`}>
                                  {winner.numero}
                                </span>
                              ))}
                              {winnerDetails.length > 2 && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-300">
                                  +{winnerDetails.length - 2}
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      {sorteio.status === 'aberto' && stats.totalNumbers > 0 && (
                        <button
                          onClick={() => finishRaffle(sorteio)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-600 dark:bg-red-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-xs sm:text-sm"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Finalizar Sorteio</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowVideoModal(sorteio)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                      >
                        <Link className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Vídeo</span>
                      </button>

                      {sorteio.video_link && (
                        <button
                          onClick={() => {
                            // Extract src from iframe
                            const srcMatch = sorteio.video_link.match(/src="([^"]+)"/);
                            if (srcMatch) {
                              window.open(srcMatch[1], '_blank');
                            }
                          }}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs sm:text-sm"
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Ver Vídeo</span>
                        </button>
                      )}

                      {winnerDetails.length > 0 && (
                        <button
                          onClick={() => setShowWinnersModal(sorteio)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-yellow-600 dark:bg-yellow-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors text-xs sm:text-sm"
                        >
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Ver Ganhadores</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(sorteio)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 dark:bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setShowDeleteModal(sorteio)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-600 dark:bg-red-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-xs sm:text-sm"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Winners Modal */}
      {showWinnersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ganhadores - {showWinnersModal.nome}
                </h3>
                <button
                  onClick={() => setShowWinnersModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {getWinnerDetails(showWinnersModal).map((winner, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      winner.isPrincipal
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-500'
                        : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-400 dark:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${
                          winner.isPrincipal
                            ? 'bg-yellow-200 dark:bg-yellow-800'
                            : 'bg-purple-200 dark:bg-purple-800'
                        }`}>
                          {winner.isPrincipal ? (
                            <Crown className={`w-6 h-6 ${
                              winner.isPrincipal ? 'text-yellow-700 dark:text-yellow-200' : 'text-purple-700 dark:text-purple-200'
                            }`} />
                          ) : (
                            <Award className="w-6 h-6 text-purple-700 dark:text-purple-200" />
                          )}
                        </div>
                        <div>
                          <h4 className={`text-lg font-bold ${
                            winner.isPrincipal ? 'text-yellow-900 dark:text-yellow-100' : 'text-purple-900 dark:text-purple-100'
                          }`}>
                            {winner.prizeName}
                          </h4>
                          <p className={`text-sm ${
                            winner.isPrincipal ? 'text-yellow-700 dark:text-yellow-300' : 'text-purple-700 dark:text-purple-300'
                          }`}>
                            Número sorteado: <span className="font-mono font-bold">{winner.numero}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {winner.user ? (
                          <div>
                            <div className="flex items-center justify-end space-x-2 mb-1">
                              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {winner.user.nome}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{winner.user.email}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{winner.user.cpf}</p>
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400">
                            <p className="text-sm">Usuário não encontrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Criar Novo Sorteio</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-6 pt-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Sorteio
                  </label>
                  <input
                    type="text"
                    value={newRaffle.nome}
                    onChange={(e) => setNewRaffle({...newRaffle, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Sorteio Dezembro 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link do Vídeo (opcional)
                  </label>
                  <input
                    type="url"
                    value={newRaffle.video_link}
                    onChange={(e) => setNewRaffle({...newRaffle, video_link: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Será convertido automaticamente para iframe
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Data do Sorteio (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newRaffle.data_sorteio}
                    onChange={(e) => setNewRaffle({...newRaffle, data_sorteio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Data e hora programada para o sorteio
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    Banner do Sorteio (opcional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        id="banner-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingImage ? 'Enviando...' : 'Escolher Imagem'}</span>
                      </label>
                      {newRaffle.banner_image && (
                        <button
                          type="button"
                          onClick={() => setNewRaffle({...newRaffle, banner_image: ''})}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    {newRaffle.banner_image && (
                      <div className="border border-gray-300 dark:border-gray-600 rounded-md p-2">
                        <img
                          src={newRaffle.banner_image}
                          alt="Preview do banner"
                          className="max-w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 3MB
                    </p>
                  </div>
                </div>

                {/* Prizes Configuration */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Configuração dos Prêmios</h4>
                    <button
                      onClick={addPremio}
                      className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Prêmio</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {premios.map((premio, index) => (
                      <div key={premio.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center space-x-2">
                          {index === 0 ? (
                            <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {index + 1}º
                          </span>
                        </div>
                        <input
                          type="text"
                          value={premio.nome}
                          onChange={(e) => updatePremio(premio.id, 'nome', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Nome do prêmio"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={premio.quantidade_numeros}
                            onChange={(e) => updatePremio(premio.id, 'quantidade_numeros', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">números</span>
                        </div>
                        {premios.length > 1 && (
                          <button
                            onClick={() => removePremio(premio.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Configuração dos Números</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total de Números no Sorteio
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newRaffle.total_numeros}
                        onChange={(e) => setNewRaffle({...newRaffle, total_numeros: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>



                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número Mínimo
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newRaffle.numero_minimo}
                        onChange={(e) => setNewRaffle({...newRaffle, numero_minimo: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número Máximo
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newRaffle.numero_maximo}
                        onChange={(e) => setNewRaffle({...newRaffle, numero_maximo: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Resumo:</strong> Sorteio com {newRaffle.total_numeros} números, 
                      variando de {newRaffle.numero_minimo} a {newRaffle.numero_maximo}.
                      <br />
                      <strong>Prêmios:</strong> {premios.reduce((sum, p) => sum + p.quantidade_numeros, 0)} números serão sorteados no total.
                    </p>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 p-4 sm:p-6 pt-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createRaffle}
                  disabled={!newRaffle.nome.trim() || isCreating}
                  className="flex-1 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Link Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Link do Vídeo</h3>
                <button
                  onClick={() => setShowVideoModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {showVideoModal.nome}
                  </label>
                  <input
                    type="url"
                    defaultValue={showVideoModal.video_link ? showVideoModal.video_link.match(/src="([^"]+)"/)?.[1] || '' : ''}
                    onChange={(e) => {
                      const updatedModal = { ...showVideoModal, video_link: e.target.value };
                      setShowVideoModal(updatedModal);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Será convertido automaticamente para iframe
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowVideoModal(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => updateVideoLink(showVideoModal, showVideoModal.video_link || '')}
                    className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finalizar Sorteio</h3>
                <button
                  onClick={() => setShowResultModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {showResultModal.premios && showResultModal.premios.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Prêmios a serem sorteados:</h4>
                    <div className="space-y-1">
                      {showResultModal.premios.map((premio) => (
                        <div key={premio.id} className="text-sm text-yellow-700 dark:text-yellow-300">
                          • {premio.nome}: {premio.quantidade_numeros} número{premio.quantidade_numeros > 1 ? 's' : ''}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Total: {showResultModal.premios.reduce((sum, p) => sum + p.quantidade_numeros, 0)} números serão sorteados
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Resultado
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="auto"
                        checked={resultType === 'auto'}
                        onChange={(e) => setResultType(e.target.value as any)}
                        className="mr-2"
                      />
                      <Dice1 className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Resultado Automático</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="manual"
                        checked={resultType === 'manual'}
                        onChange={(e) => setResultType(e.target.value as any)}
                        className="mr-2"
                      />
                      <Edit className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Resultado Manual</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="federal"
                        checked={resultType === 'federal'}
                        onChange={(e) => setResultType(e.target.value as any)}
                        className="mr-2"
                      />
                      <Globe className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Loteria Federal</span>
                    </label>
                  </div>
                </div>

                {resultType === 'manual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Números Vencedores (separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={manualNumbers}
                      onChange={(e) => setManualNumbers(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="12345, 67890, 54321"
                    />
                  </div>
                )}

                {resultType === 'federal' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Os números serão obtidos automaticamente do site da Loteria Federal.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowResultModal(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processRaffleResult}
                    className="flex-1 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Raffle Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Sorteio</h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-6 pt-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Sorteio
                  </label>
                  <input
                    type="text"
                    value={editRaffle.nome}
                    onChange={(e) => setEditRaffle({...editRaffle, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Sorteio Dezembro 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link do Vídeo (opcional)
                  </label>
                  <input
                    type="url"
                    value={editRaffle.video_link}
                    onChange={(e) => setEditRaffle({...editRaffle, video_link: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Será convertido automaticamente para iframe
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Data do Sorteio (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editRaffle.data_sorteio}
                    onChange={(e) => setEditRaffle({...editRaffle, data_sorteio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Data e hora programada para o sorteio
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    Banner do Sorteio (opcional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditBannerUpload}
                        className="hidden"
                        id="edit-banner-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="edit-banner-upload"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingImage ? 'Enviando...' : 'Escolher Imagem'}</span>
                      </label>
                      {editRaffle.banner_image && (
                        <button
                          type="button"
                          onClick={() => setEditRaffle({...editRaffle, banner_image: ''})}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    {editRaffle.banner_image && (
                      <div className="border border-gray-300 dark:border-gray-600 rounded-md p-2">
                        <img
                          src={editRaffle.banner_image}
                          alt="Preview do banner"
                          className="max-w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 3MB
                    </p>
                  </div>
                </div>

                {/* Prizes Configuration */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Configuração dos Prêmios</h4>
                    <button
                      onClick={addEditPremio}
                      className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Prêmio</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editPremios.map((premio, index) => (
                      <div key={premio.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center space-x-2">
                          {index === 0 ? (
                            <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {index + 1}º
                          </span>
                        </div>
                        <input
                          type="text"
                          value={premio.nome}
                          onChange={(e) => updateEditPremio(premio.id, 'nome', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Nome do prêmio"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={premio.quantidade_numeros}
                            onChange={(e) => updateEditPremio(premio.id, 'quantidade_numeros', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">números</span>
                        </div>
                        {editPremios.length > 1 && (
                          <button
                            onClick={() => removeEditPremio(premio.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Configuração dos Números</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total de Números
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editRaffle.total_numeros}
                        onChange={(e) => setEditRaffle({...editRaffle, total_numeros: parseInt(e.target.value) || 1000})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número Mínimo
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editRaffle.numero_minimo}
                        onChange={(e) => setEditRaffle({...editRaffle, numero_minimo: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número Máximo
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editRaffle.numero_maximo}
                        onChange={(e) => setEditRaffle({...editRaffle, numero_maximo: parseInt(e.target.value) || 1000})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 sm:p-6 pt-0 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateRaffle}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Excluir "{showDeleteModal.nome}"?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-yellow-400 dark:bg-yellow-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">!</span>
                      </div>
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">Atenção:</p>
                      <ul className="space-y-1">
                        <li>• O sorteio será removido permanentemente</li>
                        <li>• Todos os números de rifa associados serão excluídos</li>
                        <li>• Os prêmios configurados serão perdidos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteRaffle(showDeleteModal)}
                  className="flex-1 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Excluir Sorteio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaffleManagement;