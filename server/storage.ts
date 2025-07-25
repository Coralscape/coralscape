import {
  users,
  coralData,
  customCorals,
  tankCompositions,
  type User,
  type CoralData,
  type CustomCoral,
  type TankComposition,
  type InsertUser,
  type LoginUser,
  type InsertCoralData,
  type InsertCustomCoral,
  type InsertTankComposition,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User authentication operations
  createUser(userData: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Coral data operations (global database)
  getCorals(): Promise<CoralData[]>;
  addCoral(coral: InsertCoralData): Promise<CoralData>;
  clearCorals(): Promise<void>;
  
  // Custom coral operations (user-specific)
  getUserCustomCorals(userId: string): Promise<CustomCoral[]>;
  addCustomCoral(coral: InsertCustomCoral): Promise<CustomCoral>;
  deleteCustomCoral(id: string, userId: string): Promise<boolean>;
  
  // Tank composition operations (user-specific with names)
  getUserTankCompositions(userId: string): Promise<TankComposition[]>;
  saveTankComposition(composition: InsertTankComposition): Promise<TankComposition>;
  getTankComposition(id: string, userId: string): Promise<TankComposition | undefined>;
  updateTankComposition(id: string, userId: string, updates: Partial<InsertTankComposition>): Promise<TankComposition | undefined>;
  deleteTankComposition(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User authentication operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Coral data operations (global database)
  async getCorals(): Promise<CoralData[]> {
    return db.select().from(coralData);
  }

  async addCoral(coral: InsertCoralData): Promise<CoralData> {
    const [newCoral] = await db.insert(coralData).values(coral).returning();
    return newCoral;
  }

  async clearCorals(): Promise<void> {
    await db.delete(coralData);
  }

  // Custom coral operations (user-specific)
  async getUserCustomCorals(userId: string): Promise<CustomCoral[]> {
    return db.select().from(customCorals).where(eq(customCorals.userId, userId));
  }

  async addCustomCoral(coral: InsertCustomCoral): Promise<CustomCoral> {
    const [newCustomCoral] = await db.insert(customCorals).values(coral).returning();
    return newCustomCoral;
  }

  async deleteCustomCoral(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(customCorals)
      .where(and(eq(customCorals.id, id), eq(customCorals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Tank composition operations (user-specific with names)
  async getUserTankCompositions(userId: string): Promise<TankComposition[]> {
    return db
      .select()
      .from(tankCompositions)
      .where(eq(tankCompositions.userId, userId))
      .orderBy(tankCompositions.updatedAt);
  }

  async saveTankComposition(composition: InsertTankComposition): Promise<TankComposition> {
    const [newComposition] = await db.insert(tankCompositions).values(composition).returning();
    return newComposition;
  }

  async getTankComposition(id: string, userId: string): Promise<TankComposition | undefined> {
    const [composition] = await db
      .select()
      .from(tankCompositions)
      .where(and(eq(tankCompositions.id, id), eq(tankCompositions.userId, userId)));
    return composition;
  }

  async updateTankComposition(
    id: string,
    userId: string,
    updates: Partial<InsertTankComposition>
  ): Promise<TankComposition | undefined> {
    const [updatedComposition] = await db
      .update(tankCompositions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tankCompositions.id, id), eq(tankCompositions.userId, userId)))
      .returning();
    return updatedComposition;
  }

  async deleteTankComposition(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tankCompositions)
      .where(and(eq(tankCompositions.id, id), eq(tankCompositions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();