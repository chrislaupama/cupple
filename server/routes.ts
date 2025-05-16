import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebSocketServer } from "./websocket";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup authentication
  await setupAuth(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Therapy session routes
  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getTherapySessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch therapy sessions" });
    }
  });

  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = {
        ...req.body,
        creatorId: userId
      };
      
      const newSession = await storage.createTherapySession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create therapy session" });
    }
  });

  app.get('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const session = await storage.getTherapySession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if user has access to this session
      const userId = req.user.claims.sub;
      if (session.creatorId !== userId && session.partnerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch therapy session" });
    }
  });

  // Message routes
  app.get('/api/sessions/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Check if user has access to this session
      const userId = req.user.claims.sub;
      const session = await storage.getTherapySession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.creatorId !== userId && session.partnerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Partner routes
  app.get('/api/partners', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partners = await storage.getUserPartners(userId);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.post('/api/partners', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partnerId = req.body.partnerId;
      
      if (!partnerId) {
        return res.status(400).json({ message: "Partner ID is required" });
      }
      
      // Check if partner exists
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      // Check if partnership already exists
      const existingPartnership = await storage.getPartner(userId, partnerId);
      if (existingPartnership) {
        return res.status(409).json({ message: "Partnership already exists" });
      }
      
      // Create new partnership
      const newPartnership = await storage.createPartner({
        userId,
        partnerId,
        isActive: true
      });
      
      res.status(201).json(newPartnership);
    } catch (error) {
      console.error("Error creating partnership:", error);
      res.status(500).json({ message: "Failed to create partnership" });
    }
  });

  return httpServer;
}
