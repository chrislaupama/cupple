import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket, type MessageData } from "./useWebSocket";
import { apiRequest } from "@/lib/queryClient";

// Type for the message API response
type MessageResponse = {
  userMessageId: number;
  aiMessageId: number;
};

export type Message = {
  id: number;
  sessionId: number;
  senderId?: string;
  isAi: boolean;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
};

export type Session = {
  id: number;
  creatorId: string;
  partnerId?: string;
  title: string;
  type: "couples" | "private";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  isActive: boolean;
};

export function useChat(sessionId: number, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch message history
  const { data: messageHistory, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/messages`],
    enabled: !!sessionId,
  });
  
  // Update messages when message history changes
  useEffect(() => {
    if (messageHistory && Array.isArray(messageHistory)) {
      setMessages(messageHistory as Message[]);
    }
  }, [messageHistory]);

  // Track messages being streamed and streaming state
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Setup WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    userId,
    onMessage: (data) => {
      console.log("WebSocket message received:", data);
      
      // Handle regular messages
      if (data.type === "message" && data.message) {
        setMessages((prevMessages) => {
          // Avoid duplicate messages
          if (prevMessages.some(msg => msg.id === data.message.id)) {
            return prevMessages;
          }
          return [...prevMessages, data.message];
        });
      }
      
      // Handle streaming message chunks
      else if (data.type === "stream" && data.messageId !== undefined) {
        setIsStreaming(true);
        
        // Update the streaming content with safe fallback
        const fullContent = data.fullContent || "";
        const messageId = data.messageId;
        
        // First remove any typing indicators
        setMessages(prevMessages => {
          return prevMessages.filter(msg => msg.id !== -999);
        });
        
        // Then check if this message exists in our messages array
        setMessages(prevMessages => {
          const exists = prevMessages.some(msg => msg.id === messageId);
          
          if (exists) {
            // Update existing message
            return prevMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: fullContent }
                : msg
            );
          } else {
            // Add new streaming message with guaranteed numeric ID
            const newMessage: Message = {
              id: messageId as number, // We know it's a number from the server
              sessionId: sessionId,
              isAi: true,
              content: fullContent,
              createdAt: new Date().toISOString(),
              sender: {
                id: "ai",
                name: "Dr. AI Therapist"
              }
            };
            return [...prevMessages, newMessage];
          }
        });
      }
      
      // Handle stream complete notification
      else if (data.type === "stream_complete" || data.type === "stream_end") {
        console.log("Stream complete received:", data);
        setIsStreaming(false);
        
        // If sessionId matches current session, update messages
        if (data.sessionId === sessionId) {
          console.log("Stream complete for session:", sessionId);
          
          // First update the message with the full content if we have it
          if (data.fullContent && data.messageId) {
            setMessages(prevMessages => {
              return prevMessages.map(msg => 
                msg.id === data.messageId 
                  ? { ...msg, content: data.fullContent || msg.content }
                  : msg
              );
            });
          }
          
          // Then re-fetch all messages to ensure consistency
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/messages`] });
          }, 300);
        }
      }
    },
    onConnected: () => {
      setIsReady(true);
    },
  });

  // Setup polling for AI message updates
  const startMessagePolling = (messageId: number) => {
    let intervalId: NodeJS.Timeout;
    let previousContent = "";
    let attempts = 0;
    const maxAttempts = 40; // About 12 seconds of polling before giving up
    
    setIsStreaming(true);
    
    const pollMessage = async () => {
      try {
        attempts++;
        const response = await fetch(`/api/messages/${messageId}/stream`);
        const data = await response.json();
        
        // If we have an actual message (not just "Thinking...")
        if (data.content !== previousContent && data.content !== "Thinking...") {
          previousContent = data.content;
          
          // Update message in the UI
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: data.content }
                : msg
            )
          );
          
          // Message is complete when it has content and isn't just "Thinking..."
          if (data.content && data.content !== "Thinking..." && data.isComplete) {
            console.log("Message complete, stopping polling");
            clearInterval(intervalId);
            setIsStreaming(false);
          }
        }
        
        // If we've been polling for too long, stop
        if (attempts >= maxAttempts) {
          console.log("Max polling attempts reached, stopping");
          clearInterval(intervalId);
          setIsStreaming(false);
          
          // If we didn't get a real response, show a fallback message
          if (data.content === "Thinking..." || !data.content) {
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === messageId 
                  ? { ...msg, content: "I'm having trouble connecting right now. Please try again in a moment." }
                  : msg
              )
            );
          }
        }
      } catch (error) {
        console.error("Error polling message:", error);
        attempts += 5; // Increase attempts faster on error
        
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setIsStreaming(false);
        }
      }
    };
    
    // Poll every 300ms
    intervalId = setInterval(pollMessage, 300);
    
    // Initial poll
    pollMessage();
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  };
  
  // Function to send chat message with simpler polling approach
  const sendChatMessage = async (content: string) => {
    if (!session) {
      console.log("No active session found");
      return;
    }
    
    try {
      // Set streaming state to true when sending a message
      setIsStreaming(true);
      
      // Optimistically add user message to UI
      const tempUserMessage = {
        id: Date.now(), // Temporary ID
        sessionId,
        senderId: userId,
        content,
        isAi: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: userId,
          name: "You"
        }
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Add typing indicator
      const typingIndicator = {
        id: -999, // Special ID for typing indicator
        sessionId,
        isAi: true,
        content: "...",
        createdAt: new Date().toISOString(),
        sender: {
          id: "ai",
          name: "Dr. AI Therapist"
        }
      };
      
      // Add typing indicator immediately
      setMessages(prev => [...prev, typingIndicator]);
      
      // Send the message to the API
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/messages`, { content }) as MessageResponse;
      
      // Remove typing indicator and update user message with real ID
      setMessages(prev => 
        prev
          .filter(msg => msg.id !== -999) // Remove typing indicator
          .map(msg => msg.id === tempUserMessage.id ? { ...msg, id: response.userMessageId } : msg)
      );
      
      // Add AI message (empty at first)
      const aiMessage = {
        id: response.aiMessageId,
        sessionId,
        isAi: true,
        content: "...",
        createdAt: new Date().toISOString(),
        sender: {
          id: "ai",
          name: "Dr. AI Therapist"
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Start polling for updates to this message
      startMessagePolling(response.aiMessageId);
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
      return false;
    }
  };

  // Loading state
  const isLoading = isLoadingSession || isLoadingMessages || !isReady;

  return {
    messages,
    session,
    isLoading,
    isConnected,
    isStreaming,
    sendMessage: sendChatMessage,
  };
}
