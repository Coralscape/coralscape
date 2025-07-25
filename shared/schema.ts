import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const coralData = pgTable("coral_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fullImageUrl: text("full_image_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
});

export const tankCompositions = pgTable("tank_compositions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseImageUrl: text("base_image_url").notNull(),
  overlays: text("overlays").notNull(), // JSON string of overlay data
  watermarkPosition: text("watermark_position").notNull(),
});

export const insertCoralDataSchema = createInsertSchema(coralData).omit({ id: true });
export const insertTankCompositionSchema = createInsertSchema(tankCompositions).omit({ id: true });

export type InsertCoralData = z.infer<typeof insertCoralDataSchema>;
export type CoralData = typeof coralData.$inferSelect;
export type InsertTankComposition = z.infer<typeof insertTankCompositionSchema>;
export type TankComposition = typeof tankCompositions.$inferSelect;

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
}

export interface CanvasState {
  baseImage: string | null;
  overlays: OverlayData[];
  selectedOverlayId: string | null;
  zoom: number;
}
