import { pgTable, text, uuid, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export type UserRole = 'user' | 'admin';
export type ComprovanteStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type SorteioStatus = 'aberto' | 'encerrado';
export type CupomTipo = 'quantidade';

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  auth_id: uuid("auth_id"),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull().unique(),
  telefone: text("telefone"),
  role: text("role").$type<UserRole>().notNull().default("user"),
  senha_hash: text("senha_hash"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Sorteios table
export const sorteios = pgTable("sorteios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  data_inicio: timestamp("data_inicio").notNull().defaultNow(),
  data_fim: timestamp("data_fim"),
  data_sorteio: timestamp("data_sorteio"),
  status: text("status").$type<SorteioStatus>().notNull().default("aberto"),
  video_link: text("video_link"),
  banner_image: text("banner_image"),
  total_numeros: integer("total_numeros").notNull().default(1000),
  numeros_premiados: text("numeros_premiados").array(),
  configuracao: jsonb("configuracao").default({}),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Premios table
export const premios = pgTable("premios", {
  id: uuid("id").primaryKey().defaultRandom(),
  sorteio_id: uuid("sorteio_id").notNull().references(() => sorteios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  quantidade_numeros: integer("quantidade_numeros").notNull().default(1),
  ordem: integer("ordem").notNull().default(1),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Comprovantes table
export const comprovantes = pgTable("comprovantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sorteio_id: uuid("sorteio_id").references(() => sorteios.id, { onDelete: "cascade" }),
  valor_informado: decimal("valor_informado", { precision: 10, scale: 2 }).notNull(),
  valor_lido: decimal("valor_lido", { precision: 10, scale: 2 }),
  imagem_comprovante: text("imagem_comprovante").notNull(),
  status: text("status").$type<ComprovanteStatus>().notNull().default("pendente"),
  cupom_usado: text("cupom_usado"),
  desconto_aplicado: decimal("desconto_aplicado", { precision: 10, scale: 2 }).default("0"),
  resposta_admin: text("resposta_admin"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Numeros rifa table
export const numeros_rifa = pgTable("numeros_rifa", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sorteio_id: uuid("sorteio_id").notNull().references(() => sorteios.id, { onDelete: "cascade" }),
  numero_gerado: text("numero_gerado").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Cupons table
export const cupons = pgTable("cupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(),
  tipo: text("tipo").$type<CupomTipo>().notNull(),
  valor: integer("valor").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  data_expiracao: timestamp("data_expiracao"),
  uso_maximo: integer("uso_maximo"),
  uso_atual: integer("uso_atual").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// System config table
export const system_config = pgTable("system_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  nome: true,
  cpf: true,
  telefone: true,
  senha_hash: true,
}).extend({
  role: z.enum(['user', 'admin']).optional(),
});

export const insertSorteioSchema = createInsertSchema(sorteios).pick({
  nome: true,
  data_fim: true,
  data_sorteio: true,
  video_link: true,
  banner_image: true,
  configuracao: true,
});

export const insertComprovanteSchema = createInsertSchema(comprovantes).pick({
  user_id: true,
  sorteio_id: true,
  valor_informado: true,
  imagem_comprovante: true,
  cupom_usado: true,
});

export const insertCupomSchema = createInsertSchema(cupons).pick({
  codigo: true,
  tipo: true,
  valor: true,
  data_expiracao: true,
  uso_maximo: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Sorteio = typeof sorteios.$inferSelect;
export type InsertSorteio = z.infer<typeof insertSorteioSchema>;
export type Premio = typeof premios.$inferSelect;
export type Comprovante = typeof comprovantes.$inferSelect;
export type InsertComprovante = z.infer<typeof insertComprovanteSchema>;
export type NumeroRifa = typeof numeros_rifa.$inferSelect;
export type Cupom = typeof cupons.$inferSelect;
export type InsertCupom = z.infer<typeof insertCupomSchema>;
export type SystemConfig = typeof system_config.$inferSelect;
