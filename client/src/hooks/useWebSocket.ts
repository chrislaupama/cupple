import { useEffect, useRef, useState } from "react";

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

export function useWebSocket({
  userId,
  onMessage,
  onConnected,
  onDisconnected,
  onError,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    let reconnectTimer: NodeJS.Timeout;
    const connectWebSocket = () => {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
        if (onConnected) onConnected();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          if (onError) onError(error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (onError) onError(error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        setIsConnected(false);
        if (onDisconnected) onDisconnected();
        
        // Attempt to reconnect after a delay, unless the component is unmounting
        // or the connection was closed normally
        if (event.code !== 1000) {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    // Initialize connection
    connectWebSocket();

    // Clean up on unmount
    return () => {
      clearTimeout(reconnectTimer);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [userId, onMessage, onConnected, onDisconnected, onError]);

  // Function to send a message
  const sendMessage = (data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  return { isConnected, sendMessage };
}
