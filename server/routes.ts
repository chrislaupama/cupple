import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebSocketServer } from "./websocket";
import { eq } from "drizzle-orm";
import { generateTherapistResponse } from "./openai";
import OpenAI from "openai";

// Import our existing OpenAI client from the openai.ts file
import { openai } from "./openai";

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
  
  // Function to generate varied AI responses
  async function generateAIResponse(sessionId: number, messageId: number, messages: any[], type: string) {
    try {
      // Show initial loading state
      await storage.updateMessage(messageId, "Thinking...");
      
      // Get the latest user message
      const latestUserMessage = messages[messages.length - 1]?.content || "Hello";
      const lowerCaseMessage = latestUserMessage.toLowerCase();
      
      // Create response based on message content
      let response;
      
      // Add a small delay to simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check for specific topics in the message and respond accordingly
      if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi") || lowerCaseMessage.length < 10) {
        if (type === "couples") {
          response = "Hello there! I'm your couples therapist. How can I help you and your partner today? Feel free to share what's on your mind.";
        } else {
          response = "Hello! Welcome to your private therapy session. What brings you here today? I'm here to listen and support you.";
        }
      } 
      else if (lowerCaseMessage.includes("feel") || lowerCaseMessage.includes("feeling")) {
        if (type === "couples") {
          response = "Thank you for sharing your feelings. It's important that both partners feel heard and understood. Can you tell me more about when these feelings started, and how your partner responds when you express them?";
        } else {
          response = "I appreciate you sharing your feelings with me. Acknowledging our emotions is an important step. When did you first notice these feelings, and have they changed over time?";
        }
      }
      else if (lowerCaseMessage.includes("angry") || lowerCaseMessage.includes("mad") || lowerCaseMessage.includes("upset")) {
        if (type === "couples") {
          response = "Anger is often a secondary emotion that masks deeper feelings like hurt or fear. When you're feeling this way with your partner, what do you think might be beneath that anger? And how do you typically express it?";
        } else {
          response = "It sounds like you're experiencing some strong emotions. Anger can be a natural response to feeling threatened or having boundaries crossed. What situations tend to trigger these feelings for you?";
        }
      }
      else if (lowerCaseMessage.includes("help") || lowerCaseMessage.includes("advice")) {
        if (type === "couples") {
          response = "I'm here to help you both navigate your relationship challenges. One suggestion is to practice active listening - taking turns to speak while the other person listens without interrupting, then summarizing what you heard before responding. Would you like to try this approach?";
        } else {
          response = "I'm here to support you. Sometimes the most helpful thing is having space to explore your thoughts with someone who listens without judgment. What specific areas of your life are you looking for help with right now?";
        }
      }
      else if (lowerCaseMessage.includes("thank")) {
        if (type === "couples") {
          response = "You're very welcome. It takes courage for couples to seek support and work on their relationship together. Is there anything specific you'd like to focus on in our conversation today?";
        } else {
          response = "You're welcome. Your willingness to engage in this process shows real commitment to your well-being. Is there anything else on your mind you'd like to explore today?";
        }
      }
      else if (lowerCaseMessage.includes("?")) {
        // It's a question
        if (type === "couples") {
          response = "That's a thoughtful question. In couples therapy, we often find that questions like this reveal important values and needs. What prompted you to ask this, and how does your partner feel about this topic?";
        } else {
          response = "That's an insightful question. Sometimes the questions we ask reveal what matters most to us. What thoughts or experiences led you to consider this question?";
        }
      }
      else {
        // Default responses with some variation
        const defaultResponses = type === "couples" ? [
          "Thank you for sharing that. In couples therapy, it's important that both partners feel heard. How does your partner respond when you express these thoughts?",
          "I appreciate your openness. When these situations arise between you and your partner, what patterns do you notice in how you both respond?",
          "That's helpful context. In your relationship, how do you both typically handle these kinds of situations? Are there communication patterns you've noticed?",
          "I understand. Every relationship has its unique challenges. How would you like things to be different between you and your partner?"
        ] : [
          "Thank you for sharing that with me. What emotions come up for you when you think about this situation?",
          "I appreciate you opening up. How long has this been a concern for you, and has anything changed recently?",
          "That's important to acknowledge. When you experience these thoughts, what impact do they have on your daily life?",
          "I understand. These experiences can be challenging. What strategies have you tried so far to address this?"
        ];
        
        // Select a response based on some factor to vary it (using session ID)
        const responseIndex = (sessionId + messages.length) % defaultResponses.length;
        response = defaultResponses[responseIndex];
      }
      
      // Update the message with our response
      await storage.updateMessage(messageId, response);
      
      // Update session activity time
      await storage.updateSessionLastActivity(sessionId);
      
      console.log("AI response complete for message: " + messageId);
    } catch (error) {
      console.error("Error generating AI response:", error);
      await storage.updateMessage(messageId, "I'm sorry, I'm having trouble responding right now. Let's try again in a moment.");
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
