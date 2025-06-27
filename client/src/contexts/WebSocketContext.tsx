import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

type TitleUpdate = {
  sessionId: number;
  title: string;
  timestamp: number;
};

type WebSocketContextType = {
  isConnected: boolean;
  sendMessage: (data: any) => boolean;
  titleUpdates: TitleUpdate[];
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [titleUpdates, setTitleUpdates] = useState<TitleUpdate[]>([]);

  // Simple approach: just invalidate queries when title updates arrive
  const handleTitleUpdate = useCallback((updatedSessionId: number, newTitle: string) => {
    console.log(`Processing title update for session ${updatedSessionId}: ${newTitle}`);
    
    // Add to title updates state for visibility
    const newUpdate: TitleUpdate = {
      sessionId: updatedSessionId,
      title: newTitle,
      timestamp: Date.now()
    };
    
    setTitleUpdates(prev => {
      const filtered = prev.filter(update => update.sessionId !== updatedSessionId);
      return [...filtered, newUpdate];
    });
    
    // Force refetch sessions from server to get latest titles
    console.log("Invalidating sessions query to force refresh");
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    
    console.log(`Title updated for session ${updatedSessionId}: ${newTitle}`);
  }, []);

  // Setup global WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    userId: isAuthenticated && user ? String((user as any).id) : "",
    onTitleUpdate: handleTitleUpdate
  });

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, titleUpdates }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}