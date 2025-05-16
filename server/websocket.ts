import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { generateTherapistResponse } from "./openai";
import { storage } from "./storage";

type MessageData = {
  type: string;
  sessionId: number;
  content: string;
  sender: {
    id: string;
    name: string;
    imageUrl?: string;
  };
};

// Store active connections
const clients = new Map<string, WebSocket>();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const userId = req.url?.split("?userId=")[1];
    
    if (!userId) {
      ws.close(1008, "User ID required");
      return;
    }
    
    // Store the client connection
    clients.set(userId, ws);
    
    ws.on("message", async (data) => {
      try {
        // Parse the incoming message
        const message = JSON.parse(data.toString()) as MessageData;
        
        // Store the message in the database
        const savedMessage = await storage.createMessage({
          sessionId: message.sessionId,
          senderId: message.sender.id,
          isAi: false,
          content: message.content
        });
        
        // Get the session to determine the type and participants
        const session = await storage.getTherapySession(message.sessionId);
        
        if (!session) {
          throw new Error("Session not found");
        }
        
        // Send the message to appropriate recipients based on session type
        if (session.type === "couples") {
          // Send to both partners and update last message time
          const recipients = [session.creatorId];
          if (session.partnerId) {
            recipients.push(session.partnerId);
          }
          
          // Broadcast message to all recipients
          recipients.forEach(recipientId => {
            const client = clients.get(recipientId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "message",
                message: {
                  ...savedMessage,
                  sender: message.sender
                }
              }));
            }
          });
          
          // Generate AI response for couples therapy
          const chatHistory = await storage.getSessionMessages(message.sessionId, 10);
          const formattedMessages = chatHistory.map(msg => ({
            role: msg.isAi ? "assistant" : "user",
            content: msg.content
          }));
          
          const aiResponse = await generateTherapistResponse(formattedMessages, "couples");
          
          // Save AI response to database
          const savedAiMessage = await storage.createMessage({
            sessionId: message.sessionId,
            isAi: true,
            content: aiResponse
          });
          
          // Send AI response to all recipients
          recipients.forEach(recipientId => {
            const client = clients.get(recipientId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "message",
                message: {
                  ...savedAiMessage,
                  sender: {
                    id: "ai",
                    name: "Dr. AI Therapist"
                  }
                }
              }));
            }
          });
          
        } else if (session.type === "private") {
          // Private therapy - only send to the creator
          const client = clients.get(session.creatorId);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "message",
              message: {
                ...savedMessage,
                sender: message.sender
              }
            }));
          }
          
          // Generate AI response for private therapy
          const chatHistory = await storage.getSessionMessages(message.sessionId, 10);
          const formattedMessages = chatHistory.map(msg => ({
            role: msg.isAi ? "assistant" : "user",
            content: msg.content
          }));
          
          const aiResponse = await generateTherapistResponse(formattedMessages, "private");
          
          // Save AI response to database
          const savedAiMessage = await storage.createMessage({
            sessionId: message.sessionId,
            isAi: true,
            content: aiResponse
          });
          
          // Send AI response to the creator only
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "message",
              message: {
                ...savedAiMessage,
                sender: {
                  id: "ai",
                  name: "Dr. AI Therapist"
                }
              }
            }));
          }
        }
        
        // Update session's lastMessageAt
        await storage.updateSessionLastActivity(message.sessionId);
        
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Failed to process message"
        }));
      }
    });
    
    ws.on("close", () => {
      // Remove the client from our map when they disconnect
      clients.delete(userId);
    });
  });
  
  return wss;
}
