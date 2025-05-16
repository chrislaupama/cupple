import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket, type MessageData } from "./useWebSocket";
import { apiRequest } from "@/lib/queryClient";

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
        
        // Check if this message exists in our messages array
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
        setIsStreaming(false);
        
        // If sessionId matches current session, update messages
        if (data.sessionId === sessionId) {
          console.log("Stream complete for session:", sessionId);
          // Wait a moment before refetching to make sure the database is updated
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/messages`] });
          }, 500);
        }
      }
    },
    onConnected: () => {
      setIsReady(true);
    },
  });

  // Set up mutation for sending messages
  const sendChatMessage = async (content: string) => {
    if (!session) {
      console.log("No active session found");
      return;
    }
    
    if (!isConnected) {
      console.log("WebSocket is not connected");
      return;
    }

    const messageData = {
      type: "message",
      sessionId,
      content,
      sender: {
        id: userId,
        name: "You"
      }
    };

    console.log("Sending message:", messageData);
    return sendMessage(messageData);
  };

  // Loading state
  const isLoading = isLoadingSession || isLoadingMessages || !isReady;

  return {
    messages,
    session,
    isLoading,
    isConnected,
    sendMessage: sendChatMessage,
  };
}
