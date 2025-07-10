import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { premios } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware para todas as rotas da API
  app.use('/api', (req, res, next) => {
    res.header('Content-Type', 'application/json');
    next();
  });

  // Rotas de Autenticação
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { nome, cpf, telefone, senha } = req.body;
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByCpf(cpf);
      if (existingUser) {
        return res.status(400).json({ error: 'Usuário já existe com este CPF' });
      }

      // Criar novo usuário
      const user = await storage.createUser({
        nome,
        cpf,
        telefone,
        role: 'user'
      });

      res.status(201).json({ 
        success: true, 
        user: { ...user, senha: undefined } 
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { cpf, senha } = req.body;
      
      // Validação de entrada
      if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha são obrigatórios' });
      }

      let user;
      
      // Verificar se é o login especial do admin
      if (cpf === '12300000000') {
        user = await storage.getUserByCpf('12300000000');
        if (!user) {
          return res.status(401).json({ error: 'Usuário não encontrado' });
        }
      } else {
        // Para usuários normais, limpar CPF (remover formatação)
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Validar formato do CPF apenas para usuários normais
        if (cpfLimpo.length !== 11) {
          return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
        }

        user = await storage.getUserByCpf(cpfLimpo);
        if (!user) {
          return res.status(401).json({ error: 'CPF não encontrado' });
        }
      }

      // Verificar se o usuário tem senha hash
      if (!user.senha_hash) {
        return res.status(401).json({ error: 'Usuário não configurado para login' });
      }

      // Verificar senha usando bcrypt
      const bcrypt = await import('bcrypt');
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      res.json({ 
        success: true, 
        user: { ...user, senha_hash: undefined }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Usuários
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...u, senha: undefined })));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint otimizado para dashboard - combina todas as informações em uma requisição
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const [users, comprovantes, sorteios, numeros] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllComprovantes(),
        storage.getAllSorteios(),
        storage.getAllNumeros()
      ]);

      const regularUsers = users.filter(u => u.role === 'user');
      const pendingVouchers = comprovantes.filter(c => c.status === 'pendente');
      const approvedVouchers = comprovantes.filter(c => c.status === 'aprovado');
      const rejectedVouchers = comprovantes.filter(c => c.status === 'rejeitado');
      const activeRaffles = sorteios.filter(s => s.status === 'aberto');

      // Calcular estatísticas
      const totalDeposited = approvedVouchers.reduce((sum, c) => {
        const valor = c.valor_lido || c.valor_informado || 0;
        return sum + Number(valor);
      }, 0);

      const totalNumbersSold = numeros.length;

      // Atividade recente
      const recentActivity = comprovantes
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Top usuários
      const userStats = regularUsers.map(user => {
        const userVouchers = comprovantes.filter(c => c.user_id === user.id);
        const totalDeposited = userVouchers
          .filter(c => c.status === 'aprovado')
          .reduce((sum, c) => sum + Number(c.valor_lido || c.valor_informado || 0), 0);
        const totalApproved = userVouchers.filter(c => c.status === 'aprovado').length;
        
        return { user, totalDeposited, totalApproved };
      }).sort((a, b) => b.totalDeposited - a.totalDeposited).slice(0, 5);

      // Dados mensais - otimizado com processamento mais eficiente
      const monthlyStats = new Map();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // Processar apenas os últimos 12 meses para melhor performance
      const relevantDate = new Date(currentYear, currentMonth - 11, 1);
      
      approvedVouchers
        .filter(voucher => new Date(voucher.created_at) >= relevantDate)
        .forEach(voucher => {
          const date = new Date(voucher.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const value = Number(voucher.valor_lido || voucher.valor_informado || 0);
          
          if (!monthlyStats.has(monthKey)) {
            monthlyStats.set(monthKey, { deposits: 0, revenue: 0 });
          }
          
          monthlyStats.get(monthKey).deposits += value;
        });

      const monthlyData = Array.from(monthlyStats.entries())
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          deposits: data.deposits,
          revenue: data.revenue
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        stats: {
          totalUsers: regularUsers.length,
          pendingVouchers: pendingVouchers.length,
          approvedVouchers: approvedVouchers.length,
          rejectedVouchers: rejectedVouchers.length,
          activeRaffles: activeRaffles.length,
          totalNumbersSold,
          totalDeposited
        },
        recentActivity,
        topUsers: userStats,
        monthlyData,
        currentRaffle: activeRaffles[0] || null
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ ...user, senha: undefined });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      res.json({ ...updatedUser, senha: undefined });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      // Note: This would need to be implemented in storage interface
      // For now, return method not implemented
      res.status(501).json({ error: 'Funcionalidade não implementada' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Sorteios
  app.get('/api/sorteios', async (req, res) => {
    try {
      const sorteios = await storage.getAllSorteios();
      res.json(sorteios);
    } catch (error) {
      console.error('Erro ao buscar sorteios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/sorteios/ativos', async (req, res) => {
    try {
      const sorteios = await storage.getActiveSorteios();
      res.json(sorteios);
    } catch (error) {
      console.error('Erro ao buscar sorteios ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/sorteios/:id', async (req, res) => {
    try {
      const sorteio = await storage.getSorteio(req.params.id);
      if (!sorteio) {
        return res.status(404).json({ error: 'Sorteio não encontrado' });
      }
      res.json(sorteio);
    } catch (error) {
      console.error('Erro ao buscar sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/sorteios', async (req, res) => {
    try {
      // Process dates properly
      const { premios: premiosData, ...sorteioData } = req.body;
      
      // Convert date strings to Date objects if they exist
      if (sorteioData.data_sorteio) {
        sorteioData.data_sorteio = new Date(sorteioData.data_sorteio);
      }
      if (sorteioData.data_fim) {
        sorteioData.data_fim = new Date(sorteioData.data_fim);
      }
      
      // Create sorteio
      const sorteio = await storage.createSorteio(sorteioData);
      
      // Create premios if provided
      if (premiosData && premiosData.length > 0) {
        console.log('Criando prêmios para sorteio:', sorteio.id);
        console.log('Dados dos prêmios recebidos:', premiosData);
        
        const premiosToInsert = premiosData.map((premio: any) => ({
          sorteio_id: sorteio.id,
          nome: premio.nome,
          quantidade_numeros: premio.quantidade_numeros,
          ordem: premio.ordem
        }));
        
        console.log('Prêmios a serem inseridos:', premiosToInsert);
        await db.insert(premios).values(premiosToInsert);
        console.log('Prêmios inseridos com sucesso');
      } else {
        console.log('Nenhum prêmio fornecido para criação');
      }
      
      res.status(201).json(sorteio);
    } catch (error) {
      console.error('Erro ao criar sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/sorteios/:id', async (req, res) => {
    try {
      // Process dates properly and separate premios
      const { premios: premiosData, ...sorteioData } = req.body;
      console.log('Updating sorteio with data:', { sorteioData, premiosData });
      
      // Clean up and convert date strings to Date objects if they exist
      if (sorteioData.data_sorteio) {
        // Only convert if it's a string, otherwise keep as is
        if (typeof sorteioData.data_sorteio === 'string') {
          sorteioData.data_sorteio = new Date(sorteioData.data_sorteio);
        }
      }
      if (sorteioData.data_fim) {
        // Only convert if it's a string, otherwise keep as is
        if (typeof sorteioData.data_fim === 'string') {
          sorteioData.data_fim = new Date(sorteioData.data_fim);
        }
      }
      if (sorteioData.data_inicio) {
        // Only convert if it's a string, otherwise keep as is
        if (typeof sorteioData.data_inicio === 'string') {
          sorteioData.data_inicio = new Date(sorteioData.data_inicio);
        }
      }
      
      // Remove fields that shouldn't be updated directly
      const cleanedData = { ...sorteioData };
      delete cleanedData.id;
      delete cleanedData.created_at;
      delete cleanedData.updated_at;
      delete cleanedData.premios;
      delete cleanedData.data_inicio; // Remove data_inicio to avoid conversion issues
      delete cleanedData.data_fim; // Remove data_fim to avoid conversion issues
      
      // Update sorteio
      const sorteio = await storage.updateSorteio(req.params.id, cleanedData);
      
      // Update premios if provided
      if (premiosData && Array.isArray(premiosData)) {
        console.log('Atualizando prêmios para sorteio:', req.params.id);
        console.log('Dados dos prêmios recebidos:', premiosData);
        
        // First, delete existing premios for this sorteio
        await db.delete(premios).where(eq(premios.sorteio_id, req.params.id));
        console.log('Prêmios antigos deletados');
        
        // Then create new premios
        if (premiosData.length > 0) {
          const premiosToInsert = premiosData.map((premio: any) => ({
            sorteio_id: req.params.id,
            nome: premio.nome,
            quantidade_numeros: premio.quantidade_numeros,
            ordem: premio.ordem
          }));
          console.log('Prêmios a serem inseridos:', premiosToInsert);
          await db.insert(premios).values(premiosToInsert);
          console.log('Prêmios atualizados com sucesso');
        }
      } else {
        console.log('Nenhum prêmio fornecido para atualização');
      }
      
      res.json(sorteio);
    } catch (error) {
      console.error('Erro ao atualizar sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.delete('/api/sorteios/:id', async (req, res) => {
    try {
      const success = await storage.deleteSorteio(req.params.id);
      if (success) {
        res.json({ success: true, message: 'Sorteio excluído com sucesso' });
      } else {
        res.status(404).json({ error: 'Sorteio não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao excluir sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Prêmios  
  app.post('/api/premios', async (req, res) => {
    try {
      // Como não temos storage específico para prêmios, vamos retornar sucesso
      // Os prêmios são armazenados junto com o sorteio
      res.status(201).json({ success: true, message: 'Prêmio criado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar prêmio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Comprovantes
  app.get('/api/comprovantes', async (req, res) => {
    try {
      const comprovantes = await storage.getAllComprovantes();
      res.json(comprovantes);
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/comprovantes/user/:userId', async (req, res) => {
    try {
      const comprovantes = await storage.getComprovantesByUser(req.params.userId);
      res.json(comprovantes);
    } catch (error) {
      console.error('Erro ao buscar comprovantes do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/comprovantes', async (req, res) => {
    try {
      const { sorteio_id, valor_informado, cupom_usado, desconto_aplicado } = req.body;
      
      // Verificar se o sorteio existe e está ativo
      const sorteio = await storage.getSorteio(sorteio_id);
      if (!sorteio) {
        return res.status(404).json({ error: 'Sorteio não encontrado' });
      }
      
      if (sorteio.status !== 'aberto') {
        return res.status(400).json({ error: 'Sorteio não está aberto para participação' });
      }
      
      // Calcular quantos números o usuário vai receber
      const systemConfigs = await storage.getAllSystemConfig();
      const blockValueConfig = systemConfigs.find(c => c.key === 'block_value');
      const numbersPerBlockConfig = systemConfigs.find(c => c.key === 'numbers_per_block');
      
      const blockValue = blockValueConfig ? Number(blockValueConfig.value) : 100;
      const numbersPerBlock = numbersPerBlockConfig ? Number(numbersPerBlockConfig.value) : 10;
      
      // Calcular valor final após desconto
      let finalValue = Number(valor_informado);
      if (desconto_aplicado) {
        finalValue = finalValue - Number(desconto_aplicado);
      }
      
      // Calcular quantos números serão gerados
      const blocks = Math.floor(finalValue / blockValue);
      let totalNumbers = blocks * numbersPerBlock;
      
      // Adicionar números bonus do cupom se aplicável
      if (cupom_usado) {
        const cupom = await storage.getCupom(cupom_usado);
        if (cupom && cupom.tipo === 'quantidade') {
          totalNumbers += Number(cupom.valor);
        }
      }
      
      // Verificar quantos números já foram vendidos neste sorteio
      const numerosVendidos = await storage.getNumerosBySorteio(sorteio_id);
      const totalNumeros = sorteio.total_numeros || 1000; // Valor padrão se não definido
      const numerosRestantes = totalNumeros - numerosVendidos.length;
      
      // Verificar se há números suficientes disponíveis
      if (totalNumbers > numerosRestantes) {
        return res.status(400).json({
          error: 'Números insuficientes no sorteio',
          details: {
            numerosRestantes,
            numerosRequested: totalNumbers,
            maxPossible: numerosRestantes,
            message: `Você está tentando comprar ${totalNumbers} números, mas restam apenas ${numerosRestantes} números disponíveis neste sorteio. Você pode comprar no máximo ${numerosRestantes} números.`
          }
        });
      }
      
      // Se chegou até aqui, pode criar o comprovante
      const comprovante = await storage.createComprovante(req.body);
      res.status(201).json(comprovante);
    } catch (error) {
      console.error('Erro ao criar comprovante:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/comprovantes/:id', async (req, res) => {
    try {
      const comprovante = await storage.updateComprovante(req.params.id, req.body);
      res.json(comprovante);
    } catch (error) {
      console.error('Erro ao atualizar comprovante:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Números de Rifa
  app.get('/api/numeros-rifa', async (req, res) => {
    try {
      const { userId, sorteioId } = req.query;
      let numeros;
      
      if (userId) {
        numeros = await storage.getNumerosByUser(userId as string);
      } else if (sorteioId) {
        numeros = await storage.getNumerosBySorteio(sorteioId as string);
      } else {
        // Otimização: usar método direto para buscar todos os números
        numeros = await storage.getAllNumeros();
      }
      
      res.json(numeros);
    } catch (error) {
      console.error('Erro ao buscar números de rifa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Números de Rifa
  app.get('/api/numeros/user/:userId', async (req, res) => {
    try {
      const numeros = await storage.getNumerosByUser(req.params.userId);
      res.json(numeros);
    } catch (error) {
      console.error('Erro ao buscar números do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/numeros/sorteio/:sorteioId', async (req, res) => {
    try {
      const numeros = await storage.getNumerosBySorteio(req.params.sorteioId);
      res.json(numeros);
    } catch (error) {
      console.error('Erro ao buscar números do sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/numeros/gerar', async (req, res) => {
    try {
      const { user_id, valor_comprovante, sorteio_id, cupom_usado, desconto_aplicado } = req.body;
      
      console.log('Dados recebidos para geração de números:', { user_id, valor_comprovante, sorteio_id, cupom_usado, desconto_aplicado });
      
      // Verificar se o sorteio_id foi fornecido
      if (!sorteio_id) {
        return res.status(400).json({ error: 'ID do sorteio é obrigatório' });
      }
      
      // Buscar o sorteio específico
      const sorteio = await storage.getSorteio(sorteio_id);
      
      if (!sorteio) {
        return res.status(404).json({ error: 'Sorteio não encontrado' });
      }
      
      if (sorteio.status !== 'aberto') {
        return res.status(400).json({ error: 'Sorteio não está aberto para participação' });
      }
      
      // Lógica para gerar números baseado no valor
      const numeros_por_bloco = 10; // Configuração do sistema
      const valor_bloco = 100; // Configuração do sistema
      
      // Calcular valor final após desconto
      let valorFinal = Number(valor_comprovante);
      if (desconto_aplicado) {
        valorFinal = valorFinal - Number(desconto_aplicado);
      }
      
      // Calcular números baseados no valor final
      const quantidade_numeros_base = Math.floor(valorFinal / valor_bloco) * numeros_por_bloco;
      let quantidade_numeros_total = quantidade_numeros_base;
      
      // Adicionar números extras do cupom se aplicável
      if (cupom_usado) {
        const cupom = await storage.getCupom(cupom_usado);
        if (cupom && cupom.tipo === 'quantidade') {
          quantidade_numeros_total += Number(cupom.valor);
          console.log(`Cupom de quantidade aplicado: +${cupom.valor} números extras`);
        }
      }
      
      console.log(`Gerando ${quantidade_numeros_total} números (${quantidade_numeros_base} base + extras) para o sorteio ${sorteio.nome} (ID: ${sorteio_id})`);
      
      const numerosData = [];
      for (let i = 0; i < quantidade_numeros_total; i++) {
        const numero_gerado = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
        numerosData.push({
          user_id,
          sorteio_id: sorteio_id,
          numero_gerado
        });
      }
      
      const numeros = await storage.createNumeros(numerosData);
      console.log(`Números criados com sucesso para o sorteio ${sorteio.nome}:`, numeros.map(n => n.numero_gerado));
      
      res.status(201).json(numeros);
    } catch (error) {
      console.error('Erro ao gerar números:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar estatísticas de números vendidos por sorteio
  app.get('/api/sorteios/:id/estatisticas', async (req, res) => {
    try {
      const sorteioId = req.params.id;
      const sorteio = await storage.getSorteio(sorteioId);
      
      if (!sorteio) {
        return res.status(404).json({ error: 'Sorteio não encontrado' });
      }
      
      const numerosVendidos = await storage.getNumerosBySorteio(sorteioId);
      const totalNumeros = sorteio.total_numeros || 1000; // Valor padrão se não definido
      const numerosVendidosCount = numerosVendidos.length;
      const numerosRestantes = totalNumeros - numerosVendidosCount;
      
      res.json({
        totalNumeros,
        numerosVendidos: numerosVendidosCount,
        numerosRestantes,
        percentualVendido: ((numerosVendidosCount / totalNumeros) * 100).toFixed(1)
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do sorteio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Cupons
  app.get('/api/cupons', async (req, res) => {
    try {
      const cupons = await storage.getAllCupons();
      res.json(cupons);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/cupons/:codigo', async (req, res) => {
    try {
      const cupom = await storage.getCupom(req.params.codigo);
      if (!cupom) {
        return res.status(404).json({ error: 'Cupom não encontrado' });
      }
      res.json(cupom);
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/cupons', async (req, res) => {
    try {
      const cupom = await storage.createCupom(req.body);
      res.status(201).json(cupom);
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/cupons/:id', async (req, res) => {
    try {
      const cupom = await storage.updateCupom(req.params.id, req.body);
      res.json(cupom);
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Configuração do Sistema
  app.get('/api/system-config', async (req, res) => {
    try {
      const configs = await storage.getAllSystemConfig();
      res.json(configs);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/system-config/:key', async (req, res) => {
    try {
      const config = await storage.getSystemConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: 'Configuração não encontrada' });
      }
      res.json(config);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/system-config/:key', async (req, res) => {
    try {
      const config = await storage.updateSystemConfig(req.params.key, req.body.value);
      res.json(config);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
