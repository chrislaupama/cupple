import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { getSimpleTherapyResponse } from "./openai";
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

// Function to broadcast title updates to connected clients
export function broadcastTitleUpdate(sessionId: number, newTitle: string, userId: string) {
  console.log(`Broadcasting title update to user ${userId}: "${newTitle}" for session ${sessionId}`);
  console.log(`Connected clients: ${Array.from(clients.keys()).join(', ')}`);
  
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    const message = {
      type: "title_update",
      sessionId: sessionId,
      title: newTitle
    };
    console.log("Sending WebSocket message:", message);
    client.send(JSON.stringify(message));
  } else {
    console.log(`WebSocket client not available for user ${userId} (readyState: ${client?.readyState})`);
  }
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = req.url;
    const userId = url?.includes("?userId=") ? url.split("?userId=")[1]?.split("&")[0] : null;

    console.log(`WebSocket connection attempt with userId: ${userId}`);

    if (!userId || userId.trim() === "") {
      console.log("WebSocket connection closed: No user ID provided");
      ws.close(1008, "User ID required");
      return;
    }

    // Store the client connection
    clients.set(userId, ws);
    console.log(`WebSocket client connected for user: ${userId}`);

    ws.on("message", async (data) => {
      try {
        // Parse the incoming message
        const message = JSON.parse(data.toString()) as MessageData;
        console.log("WebSocket received message:", message);

        // Store the message in the database
        const savedMessage = await storage.createMessage({
          sessionId: message.sessionId,
          senderId: message.sender.id,
          isAi: false,
          content: message.content
        });

        console.log("Saved user message to database:", savedMessage);

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

          console.log("Generating AI response with message history:", formattedMessages);

          // Get recipients for couples therapy
          let messageRecipients = [session.creatorId];
          if (session.partnerId) {
            messageRecipients.push(session.partnerId);
          }

          // Create AI message in the database
          const aiMessage = await storage.createMessage({
            sessionId: message.sessionId,
            isAi: true,
            content: ""
          });

          // Generate AI response once and broadcast to all recipients
          getSimpleTherapyResponse(
            message.content,
            session.type,
            (chunk: string) => {
              // Broadcast chunk to all connected recipients
              messageRecipients.forEach(recipientId => {
                const client = clients.get(recipientId);
                if (client && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: "stream",
                    messageId: aiMessage.id,
                    content: chunk
                  }));
                }
              });
            }
          ).then(async (fullResponse: string) => {
            // Update message in database with full content
            await storage.updateMessage(aiMessage.id, fullResponse);
            
            // Send stream complete notification to all recipients
            messageRecipients.forEach(recipientId => {
              const client = clients.get(recipientId);
              if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stream_complete",
                  messageId: aiMessage.id,
                  sessionId: session.id,
                  fullContent: fullResponse
                }));
              }
            });
          }).catch((error: unknown) => {
            console.error("Error in AI response:", error);
            // Send error to all recipients
            messageRecipients.forEach(recipientId => {
              const client = clients.get(recipientId);
              if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "error",
                  messageId: aiMessage.id,
                  error: "Failed to generate response"
                }));
              }
            });
          });

          console.log("AI response generation started");

          // The AI message is already saved to the database and streaming is handled above.
          // No need to save message again or send messages as they are handled in streaming code.

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

          console.log("Generating AI response for private therapy with history:", formattedMessages);

          // Get client for streaming
          const streamClient = clients.get(session.creatorId);

          // Generate AI response for private therapy with streaming
          console.log("Starting AI response generation for private therapy");
          
          // Create initial empty AI message
          const aiMessage = await storage.createMessage({
            sessionId: message.sessionId,
            isAi: true,
            content: ""
          });
          
          // Generate AI response with streaming
          await getSimpleTherapyResponse(
            message.content,
            session.type,
            (chunk: string) => {
              if (streamClient && streamClient.readyState === WebSocket.OPEN) {
                streamClient.send(JSON.stringify({
                  type: "stream",
                  messageId: aiMessage.id,
                  content: chunk
                }));
              }
            }
          ).then(async (fullResponse: string) => {
            // Update the message in database with full response
            await storage.updateMessage(aiMessage.id, fullResponse);
            
            // Send stream complete notification
            if (streamClient && streamClient.readyState === WebSocket.OPEN) {
              streamClient.send(JSON.stringify({
                type: "stream_complete",
                messageId: aiMessage.id,
                sessionId: message.sessionId,
                fullContent: fullResponse
              }));
            }
          }).catch((error: unknown) => {
            console.error("Private therapy AI response error:", error);
          });

          // Send the initial empty message to the client
          if (streamClient && streamClient.readyState === WebSocket.OPEN) {
            streamClient.send(JSON.stringify({
              type: "message",
              message: {
                ...aiMessage,
                sender: {
                  id: "ai",
                  name: "Dr. AI Therapist"
                }
              }
            }));
          }

          console.log("Private therapy AI response generation started");

          // The streaming response is already sent directly to the client
          // No need to send an additional message here
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