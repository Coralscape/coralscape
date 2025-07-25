import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { 
  insertCoralDataSchema, 
  insertTankCompositionSchema,
  insertUserSchema,
  loginSchema,
  insertCustomCoralSchema,
  type User
} from "@shared/schema";
import { z } from "zod";

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const pgStore = connectPg(session);
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "coralscape-session-secret-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
    },
  }));
  // Google Sheets integration
  app.post("/api/sheets/connect", async (req, res) => {
    try {
      const { sheetsUrl } = req.body;
      
      if (!sheetsUrl) {
        return res.status(400).json({ message: "Google Sheets URL is required" });
      }

      // Extract sheet ID from URL (handles both edit and pubhtml URLs)
      const sheetIdMatch = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        return res.status(400).json({ message: "Invalid Google Sheets URL format" });
      }

      const sheetId = sheetIdMatch[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

      // Fetch data from Google Sheets
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch data from Google Sheets" });
      }

      const csvData = await response.text();
      const rows = csvData.split('\n').slice(1); // Skip header row

      // Clear existing coral data
      await storage.clearCorals();

      // Parse CSV and store coral data
      const coralData = [];
      for (const row of rows) {
        if (row.trim()) {
          // Handle CSV parsing with proper comma splitting (accounting for quoted values)
          const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cleanColumns = columns.map(col => col.replace(/^"|"$/g, '').trim());
          
          if (cleanColumns.length >= 6) {
            const data = {
              name: cleanColumns[1] || '', // Column B
              fullImageUrl: cleanColumns[2] || '', // Column C  
              thumbnailUrl: cleanColumns[3] || '', // Column D
              width: parseInt(cleanColumns[4]) || 100, // Column E
              height: parseInt(cleanColumns[5]) || 100, // Column F
            };

            if (data.name && data.fullImageUrl && data.thumbnailUrl) {
              const coral = await storage.addCoral(data);
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
      const corals = await storage.getCorals();
      res.json(corals);
    } catch (error) {
      console.error('Error fetching corals:', error);
      res.status(500).json({ message: "Failed to fetch coral data" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(userData.email);
      if (existing) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Account created successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const isValid = await storage.validatePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Logged in successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Custom coral endpoints (user-specific)
  app.get("/api/custom-corals", requireAuth, async (req, res) => {
    try {
      const customCorals = await storage.getUserCustomCorals(req.session.userId!);
      res.json(customCorals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/custom-corals", requireAuth, async (req, res) => {
    try {
      const coralData = insertCustomCoralSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      const coral = await storage.addCustomCoral(coralData);
      res.json(coral);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/custom-corals/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomCoral(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "Custom coral not found" });
      }
      res.json({ message: "Custom coral deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tank composition endpoints (user-specific with names)
  app.get("/api/tank-compositions", requireAuth, async (req, res) => {
    try {
      const compositions = await storage.getUserTankCompositions(req.session.userId!);
      res.json(compositions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tank-compositions", requireAuth, async (req, res) => {
    try {
      const composition = insertTankCompositionSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      const saved = await storage.saveTankComposition(composition);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tank-compositions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const composition = await storage.getTankComposition(id, req.session.userId!);
      
      if (!composition) {
        return res.status(404).json({ message: "Tank composition not found" });
      }
      
      res.json(composition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tank-compositions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTankCompositionSchema.partial().parse(req.body);
      const updated = await storage.updateTankComposition(id, req.session.userId!, updates);
      if (!updated) {
        return res.status(404).json({ message: "Tank composition not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/tank-compositions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTankComposition(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "Tank composition not found" });
      }
      res.json({ message: "Tank composition deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
