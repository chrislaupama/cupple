import OpenAI from "openai";
import { WebSocket } from "ws";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to generate AI therapist responses
// Non-streaming version for reference
export async function generateTherapistResponse(
  messages: Array<{ role: string; content: string }>,
  type: string,
  client?: WebSocket,
  sessionId?: number,
  isStream: boolean = false
): Promise<string> {
  try {
    console.log(`Generating ${type} therapy response with OpenAI API`);
    
    // Prepare messages in the correct format for OpenAI API
    const systemMessage = {
      role: "system" as const,
      content: getTherapistSystemPrompt(type)
    };
    
    const formattedMessages = messages.map(msg => ({
      role: (msg.role === "user" || msg.role === "assistant") 
        ? msg.role as "user" | "assistant" 
        : "user" as const,
      content: msg.content
    }));
    
    // If streaming is requested and we have a client
    if (isStream && client) {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemMessage, ...formattedMessages],
        stream: true,
      });
      
      let fullResponse = '';
      let messageId: number | null = null;
      
      // Save empty message to get ID
      if (sessionId) {
        const savedMessage = await storage.createMessage({
          sessionId: sessionId,
          isAi: true,
          content: ""
        });
        messageId = savedMessage.id;
      }
      
      // Process the stream
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          
          // Send incremental update to client
          if (client && client.readyState === WebSocket.OPEN && messageId) {
            client.send(JSON.stringify({
              type: "stream",
              messageId: messageId,
              content: content,
              fullContent: fullResponse,
              sessionId: sessionId
            }));
          }
        }
      }
      
      // Update the message with complete content
      if (sessionId && messageId) {
        await storage.updateMessage(messageId, fullResponse);
        
        // Send completion notification to client
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "stream_end",
            messageId: messageId,
            sessionId: sessionId,
            fullContent: fullResponse
          }));
        }
      }
      
      console.log(`OpenAI streaming response completed: ${fullResponse.substring(0, 100)}...`);
      
      return fullResponse;
    } else {
      // Non-streaming version
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemMessage, ...formattedMessages],
      });

      const responseText = response.choices[0].message.content || "I'm not sure how to respond to that.";
      console.log(`OpenAI response received: ${responseText.substring(0, 100)}...`);
      
      return responseText;
    }
  } catch (error: any) {
    console.error("Error generating therapist response:", error);
    
    // Check for specific API key issues
    if (error.toString && error.toString().includes('API key')) {
      console.error("API key issue detected. Please check OPENAI_API_KEY is valid and correctly set.");
    }
    
    throw new Error("Failed to generate therapist response");
  }
}

// Helper function to get the system prompt based on therapy type
function getTherapistSystemPrompt(type: string): string {
  if (type === "couples") {
    return `You are Dr. AI Therapist, a compassionate and skilled couples therapist. 
    Your goal is to help couples improve their communication, resolve conflicts, and strengthen their relationship.
    Your responses should be empathetic, insightful, and focused on practical advice.
    Ask thoughtful questions to understand both perspectives and provide balanced guidance.
    Keep responses concise (2-3 paragraphs maximum) and conversational.
    Never share any information from private therapy sessions with either partner.
    If asked about topics outside your expertise, acknowledge limitations and redirect to appropriate professional help.`;
  } else {
    return `You are Dr. AI Therapist, a compassionate and insightful individual therapist in a private session.
    Your goal is to provide a safe space for clients to express feelings they might not be comfortable sharing in couples therapy.
    Your responses should be empathetic, non-judgmental, and supportive.
    Ask thoughtful questions to help clients explore their feelings and perspectives.
    Keep responses concise (2-3 paragraphs maximum) and conversational.
    Never share this private information with the client's partner or in couples sessions.
    Emphasize healthy communication and relationship patterns while respecting privacy.
    If asked about topics outside your expertise, acknowledge limitations and redirect to appropriate professional help.`;
  }
}
