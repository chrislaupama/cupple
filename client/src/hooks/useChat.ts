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

    // Set streaming state to true when sending a message
    setIsStreaming(true);

    // Create temporary message for immediate feedback
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

    // Optimistically add user message to UI
    setMessages(prev => [...prev, tempUserMessage]);

    // Prepare message data for WebSocket
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
    
    // Send via WebSocket
    sendMessage(messageData);
    
    // Add typing indicator after a short delay
    setTimeout(() => {
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
      
      // Add typing indicator if we haven't received a real AI message yet
      setMessages(prev => {
        // Only add if we don't already have an AI message as the last message
        const lastMessage = prev[prev.length - 1];
        if (!lastMessage || !lastMessage.isAi) {
          return [...prev, typingIndicator];
        }
        return prev;
      });
    }, 800);
    
    return true;
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
