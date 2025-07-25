import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCoralDataSchema, insertTankCompositionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Google Sheets integration
  app.post("/api/sheets/connect", async (req, res) => {
    try {
      const { sheetsUrl } = req.body;
      
      if (!sheetsUrl) {
        return res.status(400).json({ message: "Google Sheets URL is required" });
      }

      // Extract sheet ID from URL
      const sheetIdMatch = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        return res.status(400).json({ message: "Invalid Google Sheets URL format" });
      }

      const sheetId = sheetIdMatch[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      // Fetch data from Google Sheets
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch data from Google Sheets" });
      }

      const csvData = await response.text();
      const rows = csvData.split('\n').slice(1); // Skip header row

      // Clear existing coral data
      await storage.clearCoralData();

      // Parse CSV and store coral data
      const coralData = [];
      for (const row of rows) {
        if (row.trim()) {
          const columns = row.split(',');
          if (columns.length >= 6) {
            const data = {
              name: columns[1]?.trim().replace(/"/g, '') || '',
              fullImageUrl: columns[2]?.trim().replace(/"/g, '') || '',
              thumbnailUrl: columns[3]?.trim().replace(/"/g, '') || '',
              width: parseInt(columns[4]?.trim()) || 0,
              height: parseInt(columns[5]?.trim()) || 0,
            };

            if (data.name && data.fullImageUrl && data.thumbnailUrl) {
              const coral = await storage.createCoralData(data);
              coralData.push(coral);
            }
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Successfully loaded ${coralData.length} coral specimens`,
        data: coralData 
      });
    } catch (error) {
      console.error('Error connecting to Google Sheets:', error);
      res.status(500).json({ message: "Failed to connect to Google Sheets" });
    }
  });

  // Get all coral data
  app.get("/api/corals", async (req, res) => {
    try {
      const corals = await storage.getAllCoralData();
      res.json(corals);
    } catch (error) {
      console.error('Error fetching corals:', error);
      res.status(500).json({ message: "Failed to fetch coral data" });
    }
  });

  // Save tank composition
  app.post("/api/compositions", async (req, res) => {
    try {
      const validatedData = insertTankCompositionSchema.parse(req.body);
      const composition = await storage.saveTankComposition(validatedData);
      res.json(composition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid composition data", errors: error.errors });
      }
      console.error('Error saving composition:', error);
      res.status(500).json({ message: "Failed to save composition" });
    }
  });

  // Get tank composition
  app.get("/api/compositions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const composition = await storage.getTankComposition(id);
      
      if (!composition) {
        return res.status(404).json({ message: "Composition not found" });
      }
      
      res.json(composition);
    } catch (error) {
      console.error('Error fetching composition:', error);
      res.status(500).json({ message: "Failed to fetch composition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
