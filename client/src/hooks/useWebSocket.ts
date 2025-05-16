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

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      if (onConnected) onConnected();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        if (onError) onError(error);
      }
    };

    socket.onerror = (error) => {
      if (onError) onError(error);
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (onDisconnected) onDisconnected();
    };

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
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
