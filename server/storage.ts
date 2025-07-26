import { type CoralData, type InsertCoralData, type TankComposition, type InsertTankComposition } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Coral data methods
  getAllCoralData(): Promise<CoralData[]>;
  createCoralData(data: InsertCoralData): Promise<CoralData>;
  clearCoralData(): Promise<void>;
  
  // Tank composition methods
  saveTankComposition(composition: InsertTankComposition): Promise<TankComposition>;
  getTankComposition(id: string): Promise<TankComposition | undefined>;
}

export class MemStorage implements IStorage {
  private coralData: Map<string, CoralData>;
  private tankCompositions: Map<string, TankComposition>;

  constructor() {
    this.coralData = new Map();
    this.tankCompositions = new Map();
  }

  async getAllCoralData(): Promise<CoralData[]> {
    return Array.from(this.coralData.values());
  }

  async createCoralData(insertData: InsertCoralData): Promise<CoralData> {
    const id = randomUUID();
    const data: CoralData = { ...insertData, id };
    this.coralData.set(id, data);
    return data;
  }

  async clearCoralData(): Promise<void> {
    this.coralData.clear();
  }

  async saveTankComposition(insertComposition: InsertTankComposition): Promise<TankComposition> {
    const id = randomUUID();
    const composition: TankComposition = { ...insertComposition, id };
    this.tankCompositions.set(id, composition);
    return composition;
  }

  async getTankComposition(id: string): Promise<TankComposition | undefined> {
    return this.tankCompositions.get(id);
  }
}

export const storage = new MemStorage();
