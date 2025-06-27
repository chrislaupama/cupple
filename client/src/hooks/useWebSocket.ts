import { useEffect, useState, useRef } from "react";

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

  // Use refs to store latest callback functions to avoid reconnecting WebSocket
  const onMessageRef = useRef(onMessage);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onTitleUpdateRef = useRef(onTitleUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onTitleUpdateRef.current = onTitleUpdate;
    console.log("WebSocket refs updated, onTitleUpdate exists:", !!onTitleUpdate);
  });

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
      onConnectedRef.current?.();
    };

    websocket.onmessage = (event) => {
      try {
        const data: MessageData = JSON.parse(event.data);
        
        // Handle title updates specifically
        if (data.type === "title_update" && data.sessionId && data.title) {
          console.log("WebSocket received title update:", data);
          
          // Directly update React Query cache - bypass callbacks entirely
          import("@/lib/queryClient").then(({ queryClient }) => {
            console.log("Directly updating React Query cache for session", data.sessionId, "with title:", data.title);
            
            // Update sessions list cache
            queryClient.setQueryData(["/api/sessions"], (oldSessions: any) => {
              if (!Array.isArray(oldSessions)) return oldSessions;
              
              const updated = oldSessions.map(session => 
                session.id === data.sessionId 
                  ? { ...session, title: data.title }
                  : session
              );
              console.log("Updated sessions cache directly:", updated.find(s => s.id === data.sessionId));
              return updated;
            });
            
            // Update individual session cache
            queryClient.setQueryData(["/api/sessions", data.sessionId], (oldSession: any) => {
              if (!oldSession) return oldSession;
              return { ...oldSession, title: data.title };
            });
            
            // No need to invalidate - direct cache update should trigger re-render
          });
          
          // Also try the callback as fallback
          console.log("onTitleUpdateRef.current exists:", !!onTitleUpdateRef.current);
          if (onTitleUpdateRef.current) {
            console.log("Calling onTitleUpdate callback");
            onTitleUpdateRef.current(data.sessionId, data.title);
          } else {
            console.log("onTitleUpdateRef.current is null/undefined - using direct cache update");
          }
        } else {
          onMessageRef.current?.(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setWs(null);
      onDisconnectedRef.current?.();
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
