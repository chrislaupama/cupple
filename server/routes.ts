import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebSocketServer } from "./websocket";
import { eq } from "drizzle-orm";
import { getSimpleTherapyResponse, generateSessionTitle, generateSessionTitleStream } from "./openai";
import { broadcastTitleUpdate } from "./websocket";

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

  app.patch('/api/auth/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme } = req.body;
      
      if (!theme || !['light', 'dark', 'system'].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme preference" });
      }
      
      const user = await storage.updateUserThemePreference(userId, theme);
      res.json(user);
    } catch (error) {
      console.error("Error updating theme preference:", error);
      res.status(500).json({ message: "Failed to update theme preference" });
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
      handleAIResponse(sessionId, aiMessage.id, formattedMessages, session.type);
      
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
      // Check if streaming is complete using our completion map
      const isThinking = message.content === "Thinking..." || message.content === "...";
      const isStreamingComplete = streamingCompletionMap.get(messageId) === true;
      const isComplete = !isThinking && isStreamingComplete;
      
      res.json({
        content: message.content,
        isComplete: isComplete
      });
    } catch (error) {
      console.error("Error fetching message stream:", error);
      res.status(500).json({ message: "Failed to fetch message stream" });
    }
  });
  
  // Add dedicated API route for direct AI responses
  app.post('/api/ai/therapy', isAuthenticated, async (req, res) => {
    try {
      const { message, type } = req.body;
      
      if (!message || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      console.log(`Direct API therapy request (${type}): "${message.substring(0, 30)}..."`);
      
      // Generate response using our simplified OpenAI integration
      const response = await getSimpleTherapyResponse(message, type);
      
      return res.json({ response });
    } catch (error) {
      console.error("Error in direct therapy API:", error);
      return res.status(500).json({ 
        error: "Failed to generate response",
        fallbackResponse: "I'm having trouble responding right now. Please try again shortly."
      });
    }
  });

  // Test endpoint to manually trigger title update
  app.post('/api/sessions/:id/test-title', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      const session = await storage.getTherapySession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      console.log(`Manual title update test for session ${sessionId} to: ${title}`);
      
      // Update in database
      await storage.updateSessionTitle(sessionId, title);
      
      // Test WebSocket broadcast
      broadcastTitleUpdate(sessionId, title, session.creatorId);
      if (session.partnerId) {
        broadcastTitleUpdate(sessionId, title, session.partnerId);
      }
      
      res.json({ success: true, title });
    } catch (error) {
      console.error("Error in test title update:", error);
      res.status(500).json({ message: "Failed to update title" });
    }
  });
  
  // Track streaming completion state for messages
  const streamingCompletionMap = new Map<number, boolean>();

  // Helper function to check if session needs title generation and generate it
  async function checkAndGenerateSessionTitle(sessionId: number, userMessage: string, aiResponse: string, sessionType: string) {
    try {
      // Get the session to check current title
      const session = await storage.getTherapySession(sessionId);
      if (!session) return;

      // Check if the session has a default title that needs to be replaced
      const hasDefaultTitle = session.title.includes('Personal Session') || 
                              session.title.includes('Cupple Session') ||
                              session.title.includes('Private Session') ||
                              session.title.includes('Couples Session');

      if (!hasDefaultTitle) {
        // Session already has a custom title, don't override it
        return;
      }

      // Get all messages to see if this is one of the first exchanges
      const allMessages = await storage.getSessionMessages(sessionId);
      
      // Only generate title if this is within the first few exchanges (user + AI response pairs)
      // We count AI messages to determine if this is early in the conversation
      const aiMessageCount = allMessages.filter(msg => msg.isAi && msg.content.trim().length > 0).length;
      
      if (aiMessageCount <= 2) { // Only for the first or second AI response
        console.log(`Generating title for session ${sessionId} based on early conversation`);
        
        // Initialize streaming title variables
        let accumulatedTitle = "";
        
        // Generate the title with streaming support
        const finalTitle = await generateSessionTitleStream(userMessage, aiResponse, sessionType, (chunk: string) => {
          // Accumulate title as it streams
          accumulatedTitle += chunk;
          
          // Broadcast each chunk of the title to connected clients
          broadcastTitleUpdate(sessionId, accumulatedTitle, session.creatorId);
          if (session.partnerId) {
            broadcastTitleUpdate(sessionId, accumulatedTitle, session.partnerId);
          }
        });
        
        // Final title update to database and clients
        if (finalTitle && finalTitle !== session.title) {
          await storage.updateSessionTitle(sessionId, finalTitle);
          console.log(`Updated session ${sessionId} title to: ${finalTitle}`);
          
          // Send final complete title update
          console.log(`About to broadcast title update for session ${sessionId} to user ${session.creatorId}`);
          broadcastTitleUpdate(sessionId, finalTitle, session.creatorId);
          if (session.partnerId) {
            console.log(`About to broadcast title update for session ${sessionId} to partner ${session.partnerId}`);
            broadcastTitleUpdate(sessionId, finalTitle, session.partnerId);
          }
        }
      }
    } catch (error) {
      console.error("Error in auto-generating session title:", error);
      // Don't throw error - title generation is non-critical
    }
  }

  // Function to generate AI responses using OpenAI with streaming
  async function handleAIResponse(sessionId: number, messageId: number, messages: any[], type: string) {
    try {
      // Mark streaming as not complete for this message
      streamingCompletionMap.set(messageId, false);
      
      // Show initial loading state
      await storage.updateMessage(messageId, "Thinking...");
      
      // Get the last user message to respond to
      const lastUserMessage = messages
        .filter(msg => msg.role !== "assistant")
        .pop()?.content || "Hello";
      
      console.log(`Processing message for ${type} therapy, sessionId: ${sessionId}, messageId: ${messageId}`);
      
      // Log message for debugging
      console.log(`Generating therapy response for message: ${lastUserMessage.substring(0, 30)}...`);
      
      try {
        let accumulatedResponse = "";
        
        // Generate therapy response with streaming callback
        const aiResponse = await getSimpleTherapyResponse(lastUserMessage, type, (chunk: string) => {
          // Accumulate the response as chunks arrive
          accumulatedResponse += chunk;
          
          // Update the message in real-time with the accumulated content
          storage.updateMessage(messageId, accumulatedResponse).catch(err => {
            console.error("Error updating streaming message:", err);
          });
        });
        
        // Mark streaming as complete and do final update
        streamingCompletionMap.set(messageId, true);
        await storage.updateMessage(messageId, aiResponse);

        // Check if this is the first conversation and auto-generate title
        await checkAndGenerateSessionTitle(sessionId, lastUserMessage, aiResponse, type);
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);
        streamingCompletionMap.set(messageId, true);
        await storage.updateMessage(messageId, "I apologize for the technical difficulties. Let's try again in a moment.");
      }
      
      // Update session's last activity time
      await storage.updateSessionLastActivity(sessionId);
      
      console.log("AI response complete for message: " + messageId);
    } catch (error) {
      console.error("Error in AI response handling:", error);
      streamingCompletionMap.set(messageId, true);
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
