import { useEffect, useState } from "react";

export type MessageData = {
  type: string;
  message?: any;
  error?: string;
  // Streaming message fields
  messageId?: number;
  content?: string;
  fullContent?: string;
  // Stream complete notification
  sessionId?: number;
};

type UseWebSocketOptions = {
  userId: string;
  onMessage?: (data: MessageData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
};

// Simplified implementation that doesn't depend on actual WebSockets
// but maintains the same interface for compatibility
export function useWebSocket({
  userId,
  onMessage,
  onConnected,
  onDisconnected,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(true);

  // Simulate connection on mount
  useEffect(() => {
    if (!userId) return;
    
    console.log("Simulating connection for user:", userId);
    setIsConnected(true);
    
    // Call the onConnected callback
    if (onConnected) {
      setTimeout(() => onConnected(), 100);
    }
    
    return () => {
      console.log("Disconnecting simulation for user:", userId);
      setIsConnected(false);
      if (onDisconnected) onDisconnected();
    };
  }, [userId, onConnected, onDisconnected]);

  // Provide a no-op sendMessage function that logs but doesn't do anything
  const sendMessage = (data: any) => {
    console.log("Would send message (simulation):", data);
    return true;
  };

  return { isConnected, sendMessage };
}
