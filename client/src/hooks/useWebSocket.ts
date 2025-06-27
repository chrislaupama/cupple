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
  // Title update fields
  title?: string;
};

type UseWebSocketOptions = {
  userId: string;
  onMessage?: (data: MessageData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
  onTitleUpdate?: (sessionId: number, title: string) => void;
};

// Real WebSocket implementation with title update support
export function useWebSocket({
  userId,
  onMessage,
  onConnected,
  onDisconnected,
  onTitleUpdate,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    
    console.log("Connecting WebSocket for user:", userId);
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setWs(websocket);
      onConnected?.();
    };

    websocket.onmessage = (event) => {
      try {
        const data: MessageData = JSON.parse(event.data);
        
        // Handle title updates specifically
        if (data.type === "title_update" && data.sessionId && data.title) {
          console.log("WebSocket received title update:", data);
          onTitleUpdate?.(data.sessionId, data.title);
        } else {
          onMessage?.(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setWs(null);
      onDisconnected?.();
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [userId]);

  const sendMessage = (data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  return { isConnected, sendMessage };
}
