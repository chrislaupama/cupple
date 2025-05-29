import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { ChatContainer } from "@/components/ChatContainer";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const params = useParams();
  const sessionId = params?.id ? parseInt(params.id) : null;
  
  // Check if we're on a specific session type page
  const isCouplePage = location === "/couples";
  const isPrivatePage = location === "/private";
  
  // Fetch all sessions for sidebar
  const { data: sessions } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated
  });
  
  // Filter sessions based on current page
  const filteredSessions = sessions && Array.isArray(sessions) ? 
    (isCouplePage 
      ? sessions.filter(s => s.type === "couples")
      : isPrivatePage 
        ? sessions.filter(s => s.type === "private") 
        : sessions) 
    : [];
  
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
  
  // Redirect to welcome page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/welcome");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  // Create a function to handle creating new sessions
  const handleCreateSession = (type: "couples" | "private") => {
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${type === "private" ? "Private" : "Couples"} Session`,
        type
      }),
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    })
    .then(data => {
      window.location.href = `/session/${data.id}`;
    })
    .catch(error => {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    });
  };
  
  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Redirect handling
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
  
  // Loading state for session - keep layout but show loading in chat area
  if (sessionId && isSessionLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        
        <MobileNav />
      </div>
    );
  }
  
  // Check if we're on a specific session type page
  if (isCouplePage || isPrivatePage) {
    const sessionType = isCouplePage ? "couples" : "private";
    
    return (
      <div className="flex flex-col h-screen">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <h2 className="text-2xl font-semibold mb-4">
              {isCouplePage ? "Couples" : "Private"} Sessions
            </h2>
            
            {filteredSessions.length > 0 ? (
              <div className="grid gap-3">
                {filteredSessions.map(session => (
                  <a 
                    key={session.id} 
                    href={`/session/${session.id}`}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No {sessionType} sessions yet</p>
              </div>
            )}
            
            <button
              onClick={() => handleCreateSession(sessionType as "couples" | "private")}
              className="mt-auto w-full flex items-center justify-center gap-2 p-3 rounded-md bg-primary text-primary-foreground"
            >
              <span>New {sessionType} Session</span>
            </button>
          </div>
        </div>
        
        <MobileNav />
      </div>
    );
  }
  
  // Default home view (EmptyStateCard when not on a filtered page)
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
