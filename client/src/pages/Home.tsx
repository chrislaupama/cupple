import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import CouplesTherapy from "@/pages/CouplesTherapy";
import PrivateTherapy from "@/pages/PrivateTherapy";
import { ChatContainer } from "@/components/ChatContainer";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const params = useParams();
  const sessionId = params?.id ? parseInt(params.id) : null;
  
  // Fetch all sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated
  });
  
  // Fetch individual session if we're on a session route
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
    enabled: !!sessionId && isAuthenticated
  });
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/welcome");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Navigate effect will redirect to welcome
  }
  
  // If viewing an individual session
  if (sessionId && session) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatContainer 
              sessionId={sessionId} 
              userId={(user as any)?.id || ""} 
              chatType={session.type as "couples" | "private"} 
            />
          </div>
        </div>
        
        <MobileNav />
      </div>
    );
  }

  // Loading state for session
  if (sessionId && isSessionLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Default home view (always use EmptyStateCard for consistent experience)
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmptyStateCard />
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
