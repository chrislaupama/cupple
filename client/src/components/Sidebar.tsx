import { Link, useLocation } from "wouter";
import { Plus, HelpCircle, Settings, Users, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SessionType = {
  id: number;
  title: string;
  type: string;
  updatedAt: string;
};

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/sessions"],
  });
  
  // Create new private session
  const createPrivateSession = useMutation({
    mutationFn: async () => {
      const privateCount = Array.isArray(sessions) 
        ? sessions.filter((s: any) => s.type === "private").length + 1
        : 1;
      
      const response = await apiRequest("POST", "/api/sessions", {
        title: `Private Session ${privateCount}`,
        type: "private",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/session/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Create new couples session
  const createCouplesSession = useMutation({
    mutationFn: async () => {
      const couplesCount = Array.isArray(sessions) 
        ? sessions.filter((s: any) => s.type === "couples").length + 1
        : 1;
      
      const response = await apiRequest("POST", "/api/sessions", {
        title: `Couples Session ${couplesCount}`,
        type: "couples",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/session/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const day = 1000 * 60 * 60 * 24;
    const week = day * 7;
    
    if (diff < day) {
      return "Today";
    } else if (diff < day * 2) {
      return "Yesterday";
    } else if (diff < week) {
      return date.toLocaleDateString(undefined, { weekday: "long" });
    } else {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  };

  return (
    <nav className="flex flex-col h-full p-4 border-r">
      <div className="flex-1 overflow-auto">
        {/* Private Sessions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Private Sessions</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 text-muted-foreground"
              onClick={() => createPrivateSession.mutate()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "private")
              .slice(0, 5)
              .map((session: SessionType) => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="block">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                  </div>
                </Button>
              ))}
          
          {(!sessions || !Array.isArray(sessions) || 
            sessions.filter((session: SessionType) => session.type === "private").length === 0) && (
            <p className="text-xs text-muted-foreground px-3 py-2">No private sessions yet</p>
          )}
        </div>
      </div>

      {/* Couples Sessions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Couples Sessions</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-muted-foreground"
            onClick={() => createCouplesSession.mutate()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "couples")
              .slice(0, 5)
              .map((session: SessionType) => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="block">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                  </div>
                </Button>
              ))}
          
          {(!sessions || !Array.isArray(sessions) || 
            sessions.filter((session: SessionType) => session.type === "couples").length === 0) && (
            <p className="text-xs text-muted-foreground px-3 py-2">No couples sessions yet</p>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Fixed Links at the bottom */}
      <div className="space-y-1">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </Button>
      </div>
    </nav>
  );
}