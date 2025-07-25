import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication and ownership
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(), // Will be hashed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coral database (global, shared among all users)
export const coralData = pgTable("coral_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fullImageUrl: text("full_image_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
});

// Custom coral uploads (user-specific)
export const customCorals = pgTable("custom_corals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved tank designs (user-specific with names)
export const tankCompositions = pgTable("tank_compositions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User-defined tank name
  baseImageUrl: text("base_image_url").notNull(),
  overlays: text("overlays").notNull(), // JSON string of overlay data
  watermarkPosition: text("watermark_position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customCorals: many(customCorals),
  tankCompositions: many(tankCompositions),
}));

export const customCoralsRelations = relations(customCorals, ({ one }) => ({
  user: one(users, {
    fields: [customCorals.userId],
    references: [users.id],
  }),
}));

export const tankCompositionsRelations = relations(tankCompositions, ({ one }) => ({
  user: one(users, {
    fields: [tankCompositions.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertCoralDataSchema = createInsertSchema(coralData).omit({ id: true });
export const insertCustomCoralSchema = createInsertSchema(customCorals).omit({ id: true, createdAt: true });
export const insertTankCompositionSchema = createInsertSchema(tankCompositions).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type CustomCoral = typeof customCorals.$inferSelect;
export type InsertCustomCoral = z.infer<typeof insertCustomCoralSchema>;
export type CoralData = typeof coralData.$inferSelect;
export type InsertCoralData = z.infer<typeof insertCoralDataSchema>;
export type TankComposition = typeof tankCompositions.$inferSelect;
export type InsertTankComposition = z.infer<typeof insertTankCompositionSchema>;

// Client-side types for overlay management
export interface OverlayData {
  id: string;
  coralId: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  layer: number;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
}

export interface CanvasState {
  baseImage: string | null;
  overlays: OverlayData[];
  selectedOverlayId: string | null;
  zoom: number;
  panX: number;
  panY: number;
}
