import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebSocketServer } from "./websocket";
import { eq } from "drizzle-orm";
import { generateTherapistResponse } from "./openai";

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
  
  // Update session title
  app.patch('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: "Valid title is required" });
      }
      
      // Check if session exists and user has access
      const session = await storage.getTherapySession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const userId = req.user.claims.sub;
      if (session.creatorId !== userId) {
        return res.status(403).json({ message: "Only the creator can rename sessions" });
      }
      
      const updatedSession = await storage.updateSessionTitle(sessionId, title.trim());
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating session title:", error);
      res.status(500).json({ message: "Failed to update session title" });
    }
  });
  
  // Delete session
  app.delete('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Check if session exists and user has access
      const session = await storage.getTherapySession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const userId = req.user.claims.sub;
      if (session.creatorId !== userId) {
        return res.status(403).json({ message: "Only the creator can delete sessions" });
      }
      
      const deleted = await storage.deleteTherapySession(sessionId);
      if (deleted) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete session" });
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
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
  
  // Simple API endpoint for sending user messages
  app.post('/api/sessions/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
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
      
      // Save user message
      const userMessage = await storage.createMessage({
        sessionId,
        senderId: userId,
        isAi: false,
        content: content.trim()
      });
      
      // Create an empty AI message
      const aiMessage = await storage.createMessage({
        sessionId,
        isAi: true,
        content: ""
      });
      
      // Get chat history for context
      const chatHistory = await storage.getSessionMessages(sessionId, 10);
      const formattedMessages = chatHistory.map(msg => ({
        role: msg.isAi ? "assistant" : "user",
        content: msg.content
      }));
      
      // Start generating AI response in the background without waiting
      generateAIResponse(sessionId, aiMessage.id, formattedMessages, session.type);
      
      // Return both message IDs immediately
      res.json({
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });
  
  // API endpoint to get streamed AI chunks
  app.get('/api/messages/:id/stream', isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      // Get the current message content
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check session access
      const session = await storage.getTherapySession(message.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const userId = req.user.claims.sub;
      if (session.creatorId !== userId && session.partnerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Return the current message content and done status
      res.json({
        content: message.content,
        isComplete: message.content.length > 0 && !message.content.endsWith("...")
      });
    } catch (error) {
      console.error("Error fetching message stream:", error);
      res.status(500).json({ message: "Failed to fetch message stream" });
    }
  });
  
  // Generate AI response using the existing generateTherapistResponse function
  async function generateAIResponse(sessionId: number, messageId: number, messages: any[], type: string) {
    try {
      // Update message initially to show loading
      await storage.updateMessage(messageId, "...");
      
      // Prepare messages for the API call
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call our existing OpenAI integration function with properly formatted messages
      try {
        // Format messages correctly for OpenAI
        const apiMessages = formattedMessages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" as const : "user" as const,
          content: msg.content
        }));
        
        const aiResponse = await generateTherapistResponse(apiMessages, type);
        
        // Update with the final AI response
        await storage.updateMessage(messageId, aiResponse);
        
        // Update session's last activity time
        await storage.updateSessionLastActivity(sessionId);
        
        console.log("AI response generation complete for message: " + messageId);
      } catch (aiError) {
        console.error("Error from OpenAI API:", aiError);
        await storage.updateMessage(messageId, "I apologize, but I'm having trouble generating a response right now. Please try again shortly.");
      }
    } catch (error) {
      console.error("Error in generateAIResponse:", error);
      // Update message with error notification
      await storage.updateMessage(messageId, "Sorry, I encountered an error generating a response. Please try again.");
    }
  }

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
