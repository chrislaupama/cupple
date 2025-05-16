import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./useWebSocket";
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

  // Setup WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    userId,
    onMessage: (data) => {
      if (data.type === "message" && data.message) {
        setMessages((prevMessages) => {
          // Avoid duplicate messages
          if (prevMessages.some(msg => msg.id === data.message.id)) {
            return prevMessages;
          }
          return [...prevMessages, data.message];
        });
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
