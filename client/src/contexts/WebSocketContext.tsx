import React, { createContext, useContext, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

type WebSocketContextType = {
  isConnected: boolean;
  sendMessage: (data: any) => boolean;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // Create stable callback for title updates
  const handleTitleUpdate = useCallback((updatedSessionId: number, newTitle: string) => {
    console.log(`Processing title update for session ${updatedSessionId}: ${newTitle}`);
    
    // Update the sessions list cache
    queryClient.setQueryData(["/api/sessions"], (oldSessions: any) => {
      console.log("Updating sessions cache, current sessions:", oldSessions);
      if (!Array.isArray(oldSessions)) return oldSessions;
      
      const updated = oldSessions.map(session => 
        session.id === updatedSessionId 
          ? { ...session, title: newTitle }
          : session
      );
      console.log("Updated sessions cache:", updated);
      console.log("Session found in cache:", updated.find(s => s.id === updatedSessionId));
      return updated;
    });
    
    // Update individual session cache if it exists
    queryClient.setQueryData(["/api/sessions", updatedSessionId], (oldSession: any) => {
      if (!oldSession) return oldSession;
      console.log(`Updating individual session cache for ${updatedSessionId}:`, oldSession, "->", { ...oldSession, title: newTitle });
      return { ...oldSession, title: newTitle };
    });
    
    // Invalidate queries to force refresh
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    
    console.log(`Title updated for session ${updatedSessionId}: ${newTitle}`);
  }, []);

  // Setup global WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    userId: isAuthenticated && user ? String((user as any).id) : "",
    onTitleUpdate: handleTitleUpdate
  });

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
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