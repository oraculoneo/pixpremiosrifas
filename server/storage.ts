import { users, sorteios, premios, comprovantes, numeros_rifa, cupons, system_config, type User, type InsertUser, type Sorteio, type Comprovante, type NumeroRifa, type Cupom, type SystemConfig, type UserRole } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

// Interface para operações CRUD do sistema de rifas
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Sorteios
  getSorteio(id: string): Promise<Sorteio | undefined>;
  getAllSorteios(): Promise<Sorteio[]>;
  getActiveSorteios(): Promise<Sorteio[]>;
  createSorteio(sorteio: any): Promise<Sorteio>;
  updateSorteio(id: string, data: Partial<Sorteio>): Promise<Sorteio>;
  deleteSorteio(id: string): Promise<boolean>;
  
  // Comprovantes
  getComprovante(id: string): Promise<Comprovante | undefined>;
  getComprovantesByUser(userId: string): Promise<Comprovante[]>;
  getAllComprovantes(): Promise<Comprovante[]>;
  createComprovante(comprovante: any): Promise<Comprovante>;
  updateComprovante(id: string, data: Partial<Comprovante>): Promise<Comprovante>;
  
  // Números de rifa
  getNumerosByUser(userId: string): Promise<NumeroRifa[]>;
  getNumerosBySorteio(sorteioId: string): Promise<NumeroRifa[]>;
  getAllNumeros(): Promise<NumeroRifa[]>;
  createNumeros(numeros: any[]): Promise<NumeroRifa[]>;
  
  // Cupons
  getCupom(codigo: string): Promise<Cupom | undefined>;
  getAllCupons(): Promise<Cupom[]>;
  createCupom(cupom: any): Promise<Cupom>;
  updateCupom(id: string, data: Partial<Cupom>): Promise<Cupom>;
  
  // System Config
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getAllSystemConfig(): Promise<SystemConfig[]>;
  updateSystemConfig(key: string, value: any): Promise<SystemConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sorteios: Map<string, Sorteio>;
  private comprovantes: Map<string, Comprovante>;
  private numerosRifa: Map<string, NumeroRifa>;
  private cupons: Map<string, Cupom>;
  private systemConfigs: Map<string, SystemConfig>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.sorteios = new Map();
    this.comprovantes = new Map();
    this.numerosRifa = new Map();
    this.cupons = new Map();
    this.systemConfigs = new Map();
    this.currentId = 1;
    
    // Inserir configurações padrão do sistema
    this.initializeSystemConfig();
    this.initializeDefaultUsers();
  }

  private initializeSystemConfig() {
    const defaultConfigs = [
      { key: 'system_name', value: 'Sistema de Rifas' },
      { key: 'min_deposit_amount', value: 100 },
      { key: 'block_value', value: 100 },
      { key: 'numbers_per_block', value: 10 },
    ];
    
    defaultConfigs.forEach(config => {
      const configId = this.generateId();
      this.systemConfigs.set(config.key, {
        id: configId,
        key: config.key,
        value: config.value,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
  }

  private initializeDefaultUsers() {
    // Criar usuários admin padrão para demonstração
    const defaultUsers = [
      {
        nome: 'Administrador',
        cpf: '00000000001',
        telefone: null,
        role: 'admin' as UserRole,
      },
      {
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '(11) 99999-9999',
        role: 'user' as UserRole,
      },
      {
        nome: 'Maria Santos',
        cpf: '09876543210',
        telefone: '(11) 88888-8888',
        role: 'user' as UserRole,
      }
    ];

    defaultUsers.forEach(userData => {
      const id = this.generateId();
      const user: User = {
        id,
        auth_id: null,
        nome: userData.nome,
        cpf: userData.cpf,
        telefone: userData.telefone,
        role: userData.role,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.users.set(id, user);
    });

    console.log('✅ Usuários padrão criados com sucesso');
    console.log('Admin: CPF 00000000001, Senha: qualquer coisa');
    console.log('Usuário teste: CPF 12345678901, Senha: qualquer coisa');
  }

  private generateId(): string {
    return `id_${this.currentId++}_${Date.now()}`;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.cpf === cpf);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Como não temos email no schema, vamos buscar por nome
    return Array.from(this.users.values()).find(user => user.nome.toLowerCase().includes(email.toLowerCase()));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = {
      id,
      auth_id: null,
      nome: insertUser.nome,
      cpf: insertUser.cpf,
      telefone: insertUser.telefone || null,
      role: (insertUser.role || 'user') as UserRole,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('Usuário não encontrado');
    
    const updatedUser = { ...user, ...data, updated_at: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Sorteios
  async getSorteio(id: string): Promise<Sorteio | undefined> {
    return this.sorteios.get(id);
  }

  async getAllSorteios(): Promise<Sorteio[]> {
    return Array.from(this.sorteios.values());
  }

  async getActiveSorteios(): Promise<Sorteio[]> {
    return Array.from(this.sorteios.values()).filter(s => s.status === 'aberto');
  }

  async createSorteio(sorteioData: any): Promise<Sorteio> {
    const id = this.generateId();
    const sorteio: Sorteio = {
      id,
      nome: sorteioData.nome,
      data_inicio: new Date(),
      data_fim: sorteioData.data_fim || null,
      status: 'aberto',
      video_link: sorteioData.video_link || null,
      numeros_premiados: sorteioData.numeros_premiados || null,
      configuracao: sorteioData.configuracao || {},
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.sorteios.set(id, sorteio);
    return sorteio;
  }

  async updateSorteio(id: string, data: Partial<Sorteio>): Promise<Sorteio> {
    const sorteio = this.sorteios.get(id);
    if (!sorteio) throw new Error('Sorteio não encontrado');
    
    const updatedSorteio = { ...sorteio, ...data, updated_at: new Date() };
    this.sorteios.set(id, updatedSorteio);
    return updatedSorteio;
  }

  async deleteSorteio(id: string): Promise<boolean> {
    const sorteio = this.sorteios.get(id);
    if (!sorteio) return false;
    
    // Remove related numbers and prizes
    for (const [numId, numero] of this.numerosRifa.entries()) {
      if (numero.sorteio_id === id) {
        this.numerosRifa.delete(numId);
      }
    }
    
    this.sorteios.delete(id);
    return true;
  }

  // Comprovantes
  async getComprovante(id: string): Promise<Comprovante | undefined> {
    return this.comprovantes.get(id);
  }

  async getComprovantesByUser(userId: string): Promise<Comprovante[]> {
    return Array.from(this.comprovantes.values()).filter(c => c.user_id === userId);
  }

  async getAllComprovantes(): Promise<Comprovante[]> {
    return Array.from(this.comprovantes.values());
  }

  async createComprovante(comprovanteData: any): Promise<Comprovante> {
    const id = this.generateId();
    const comprovante: Comprovante = {
      id,
      user_id: comprovanteData.user_id,
      valor_informado: comprovanteData.valor_informado,
      valor_lido: comprovanteData.valor_lido || null,
      imagem_comprovante: comprovanteData.imagem_comprovante,
      status: 'pendente',
      cupom_usado: comprovanteData.cupom_usado || null,
      desconto_aplicado: comprovanteData.desconto_aplicado || "0",
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.comprovantes.set(id, comprovante);
    return comprovante;
  }

  async updateComprovante(id: string, data: Partial<Comprovante>): Promise<Comprovante> {
    const comprovante = this.comprovantes.get(id);
    if (!comprovante) throw new Error('Comprovante não encontrado');
    
    const updatedComprovante = { ...comprovante, ...data, updated_at: new Date() };
    this.comprovantes.set(id, updatedComprovante);
    return updatedComprovante;
  }

  // Números de rifa
  async getNumerosByUser(userId: string): Promise<NumeroRifa[]> {
    return Array.from(this.numerosRifa.values()).filter(n => n.user_id === userId);
  }

  async getNumerosBySorteio(sorteioId: string): Promise<NumeroRifa[]> {
    return Array.from(this.numerosRifa.values()).filter(n => n.sorteio_id === sorteioId);
  }

  async getAllNumeros(): Promise<NumeroRifa[]> {
    return Array.from(this.numerosRifa.values());
  }

  async createNumeros(numerosData: any[]): Promise<NumeroRifa[]> {
    const numeros: NumeroRifa[] = [];
    
    numerosData.forEach(numeroData => {
      const id = this.generateId();
      const numero: NumeroRifa = {
        id,
        user_id: numeroData.user_id,
        sorteio_id: numeroData.sorteio_id,
        numero_gerado: numeroData.numero_gerado,
        created_at: new Date(),
      };
      this.numerosRifa.set(id, numero);
      numeros.push(numero);
    });
    
    return numeros;
  }

  // Cupons
  async getCupom(codigo: string): Promise<Cupom | undefined> {
    return Array.from(this.cupons.values()).find(c => c.codigo === codigo);
  }

  async getAllCupons(): Promise<Cupom[]> {
    return Array.from(this.cupons.values());
  }

  async createCupom(cupomData: any): Promise<Cupom> {
    const id = this.generateId();
    const cupom: Cupom = {
      id,
      codigo: cupomData.codigo,
      tipo: cupomData.tipo,
      valor: cupomData.valor,
      ativo: cupomData.ativo !== undefined ? cupomData.ativo : true,
      data_expiracao: cupomData.data_expiracao || null,
      uso_maximo: cupomData.uso_maximo || null,
      uso_atual: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.cupons.set(id, cupom);
    return cupom;
  }

  async updateCupom(id: string, data: Partial<Cupom>): Promise<Cupom> {
    const cupom = this.cupons.get(id);
    if (!cupom) throw new Error('Cupom não encontrado');
    
    const updatedCupom = { ...cupom, ...data, updated_at: new Date() };
    this.cupons.set(id, updatedCupom);
    return updatedCupom;
  }

  // System Config
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfigs.get(key);
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return Array.from(this.systemConfigs.values());
  }

  async updateSystemConfig(key: string, value: any): Promise<SystemConfig> {
    const existing = this.systemConfigs.get(key);
    
    if (existing) {
      const updated = { ...existing, value, updated_at: new Date() };
      this.systemConfigs.set(key, updated);
      return updated;
    } else {
      const id = this.generateId();
      const newConfig: SystemConfig = {
        id,
        key,
        value,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.systemConfigs.set(key, newConfig);
      return newConfig;
    }
  }
}

// DatabaseStorage implementation for persistent PostgreSQL storage
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Note: email field doesn't exist in new schema, using CPF instead
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getSorteio(id: string): Promise<Sorteio | undefined> {
    const [sorteio] = await db.select().from(sorteios).where(eq(sorteios.id, id));
    return sorteio || undefined;
  }

  async getAllSorteios(): Promise<Sorteio[]> {
    // Otimização: buscar todos os sorteios e prêmios de uma só vez
    const [allSorteios, allPremios] = await Promise.all([
      db.select().from(sorteios),
      db.select().from(premios).orderBy(asc(premios.ordem))
    ]);
    
    // Agrupar prêmios por sorteio_id
    const premiosBySorteio = allPremios.reduce((acc, premio) => {
      if (!acc[premio.sorteio_id]) {
        acc[premio.sorteio_id] = [];
      }
      acc[premio.sorteio_id].push(premio);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Combinar sorteios com seus prêmios
    return allSorteios.map(sorteio => ({
      ...sorteio,
      premios: premiosBySorteio[sorteio.id] || []
    }));
  }

  async getActiveSorteios(): Promise<Sorteio[]> {
    // Otimização: buscar sorteios ativos e seus prêmios de uma só vez
    const [activeSorteios, allPremios] = await Promise.all([
      db.select().from(sorteios).where(eq(sorteios.status, 'aberto')),
      db.select().from(premios).orderBy(asc(premios.ordem))
    ]);
    
    // Filtrar apenas prêmios dos sorteios ativos
    const activeSorteioIds = new Set(activeSorteios.map(s => s.id));
    const relevantPremios = allPremios.filter(p => activeSorteioIds.has(p.sorteio_id));
    
    // Agrupar prêmios por sorteio_id
    const premiosBySorteio = relevantPremios.reduce((acc, premio) => {
      if (!acc[premio.sorteio_id]) {
        acc[premio.sorteio_id] = [];
      }
      acc[premio.sorteio_id].push(premio);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Combinar sorteios com seus prêmios
    return activeSorteios.map(sorteio => ({
      ...sorteio,
      premios: premiosBySorteio[sorteio.id] || []
    }));
  }

  async createSorteio(sorteioData: any): Promise<Sorteio> {
    const [sorteio] = await db
      .insert(sorteios)
      .values(sorteioData)
      .returning();
    return sorteio;
  }

  async updateSorteio(id: string, data: Partial<Sorteio>): Promise<Sorteio> {
    const [sorteio] = await db
      .update(sorteios)
      .set({ ...data, updated_at: new Date() })
      .where(eq(sorteios.id, id))
      .returning();
    return sorteio;
  }

  async deleteSorteio(id: string): Promise<boolean> {
    try {
      // First delete related records
      await db.delete(numeros_rifa).where(eq(numeros_rifa.sorteio_id, id));
      await db.delete(premios).where(eq(premios.sorteio_id, id));
      
      // Then delete the sorteio
      const result = await db.delete(sorteios).where(eq(sorteios.id, id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar sorteio:', error);
      return false;
    }
  }

  async getComprovante(id: string): Promise<Comprovante | undefined> {
    const [comprovante] = await db.select().from(comprovantes).where(eq(comprovantes.id, id));
    return comprovante || undefined;
  }

  async getComprovantesByUser(userId: string): Promise<Comprovante[]> {
    return await db.select().from(comprovantes).where(eq(comprovantes.user_id, userId));
  }

  async getAllComprovantes(): Promise<Comprovante[]> {
    return await db.select().from(comprovantes);
  }

  async createComprovante(comprovanteData: any): Promise<Comprovante> {
    const [comprovante] = await db
      .insert(comprovantes)
      .values(comprovanteData)
      .returning();
    return comprovante;
  }

  async updateComprovante(id: string, data: Partial<Comprovante>): Promise<Comprovante> {
    const [comprovante] = await db
      .update(comprovantes)
      .set({ ...data, updated_at: new Date() })
      .where(eq(comprovantes.id, id))
      .returning();
    return comprovante;
  }

  async getNumerosByUser(userId: string): Promise<NumeroRifa[]> {
    return await db.select().from(numeros_rifa).where(eq(numeros_rifa.user_id, userId));
  }

  async getAllNumeros(): Promise<NumeroRifa[]> {
    return await db.select().from(numeros_rifa);
  }

  async getNumerosBySorteio(sorteioId: string): Promise<NumeroRifa[]> {
    return await db.select().from(numeros_rifa).where(eq(numeros_rifa.sorteio_id, sorteioId));
  }

  async createNumeros(numerosData: any[]): Promise<NumeroRifa[]> {
    const numeros = await db
      .insert(numeros_rifa)
      .values(numerosData)
      .returning();
    return numeros;
  }

  async getCupom(codigo: string): Promise<Cupom | undefined> {
    const [cupom] = await db.select().from(cupons).where(eq(cupons.codigo, codigo));
    return cupom || undefined;
  }

  async getAllCupons(): Promise<Cupom[]> {
    return await db.select().from(cupons);
  }

  async createCupom(cupomData: any): Promise<Cupom> {
    const [cupom] = await db
      .insert(cupons)
      .values(cupomData)
      .returning();
    return cupom;
  }

  async updateCupom(id: string, data: Partial<Cupom>): Promise<Cupom> {
    const [cupom] = await db
      .update(cupons)
      .set({ ...data, updated_at: new Date() })
      .where(eq(cupons.id, id))
      .returning();
    return cupom;
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(system_config).where(eq(system_config.key, key));
    return config || undefined;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(system_config);
  }

  async updateSystemConfig(key: string, value: any): Promise<SystemConfig> {
    // Try to update first
    const [existing] = await db
      .update(system_config)
      .set({ value, updated_at: new Date() })
      .where(eq(system_config.key, key))
      .returning();

    // If no existing config, create new one
    if (!existing) {
      const [newConfig] = await db
        .insert(system_config)
        .values({ key, value })
        .returning();
      return newConfig;
    }

    return existing;
  }
}

// Use DatabaseStorage for persistent PostgreSQL storage
export const storage = new DatabaseStorage();

// Initialize default data on first run
async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminUser = await storage.getUserByCpf('12300000000');
    
    if (!adminUser) {
      console.log('🔄 Inicializando dados padrão no banco PostgreSQL...');
      
      // Import bcrypt for password hashing
      const bcrypt = await import('bcrypt');
      
      // Create default users with hashed passwords
      await storage.createUser({
        nome: 'Administrador',
        cpf: '12300000000',
        telefone: null,
        role: 'admin',
        senha_hash: await bcrypt.hash('admin123', 10),
      });

      await storage.createUser({
        nome: 'João Silva',
        cpf: '12345678901',
        telefone: '(11) 99999-9999',
        role: 'user',
        senha_hash: await bcrypt.hash('123456', 10),
      });

      await storage.createUser({
        nome: 'Maria Santos',
        cpf: '09876543210',
        telefone: '(11) 88888-8888',
        role: 'user',
        senha_hash: await bcrypt.hash('123456', 10),
      });

      await storage.createUser({
        nome: 'Aléxcio',
        cpf: '03220278108',
        telefone: '(11) 77777-7777',
        role: 'user',
        senha_hash: await bcrypt.hash('123456', 10),
      });

      // Create default system configurations
      const defaultConfigs = [
        { key: 'system_name', value: 'Sistema de Rifas' },
        { key: 'min_deposit_amount', value: 100 },
        { key: 'block_value', value: 100 },
        { key: 'numbers_per_block', value: 10 },
      ];

      for (const config of defaultConfigs) {
        await storage.updateSystemConfig(config.key, config.value);
      }

      console.log('✅ Dados padrão criados no PostgreSQL com sucesso');
      console.log('Admin: Login 12300000000, Senha admin123 | Usuários teste: CPF 12345678901, CPF 09876543210');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
}

// Initialize database on startup
initializeDatabase();
