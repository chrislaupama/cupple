import { Link, useLocation } from "wouter";
import { Plus, HelpCircle, Settings, Users, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
  const { data: sessions } = useQuery<SessionType[]>({
    queryKey: ["/api/sessions"],
  });
  
  // Create new personal session
  const createPersonalSession = useMutation({
    mutationFn: async () => {
      const personalCount = Array.isArray(sessions) 
        ? sessions.filter(s => s.type === "private").length + 1
        : 1;
      
      const response = await apiRequest("POST", "/api/sessions", {
        title: `Personal Session ${personalCount}`,
        type: "private",
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/session/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create new Cupple session
  const createCouplesSession = useMutation({
    mutationFn: async () => {
      const couplesCount = Array.isArray(sessions) 
        ? sessions.filter(s => s.type === "couples").length + 1
        : 1;
      
      const response = await apiRequest("POST", "/api/sessions", {
        title: `Cupple Session ${couplesCount}`,
        type: "couples",
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/session/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <nav className="hidden md:block w-64 border-r p-4 overflow-y-auto bg-background">
      
      {/* Personal Sessions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Personal Sessions</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 rounded-full"
            onClick={() => createPersonalSession.mutate()}
            disabled={createPersonalSession.isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {sessions && Array.isArray(sessions) ? 
            sessions
              .filter((session) => session.type === "private")
              .slice(0, 5)
              .map((session) => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(`/session/${session.id}`)}
                  onMouseEnter={() => {
                    // Prefetch session data on hover for faster navigation
                    queryClient.prefetchQuery({ queryKey: [`/api/sessions/${session.id}`] });
                    queryClient.prefetchQuery({ queryKey: [`/api/sessions/${session.id}/messages`] });
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="block">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                  </div>
                </Button>
              )) : null}
          
          {(!sessions || !Array.isArray(sessions) || 
            sessions.filter((session) => session.type === "private").length === 0) && (
            <p className="text-xs text-muted-foreground px-3 py-2">No private sessions yet</p>
          )}
        </div>
      </div>

      {/* Cupple Sessions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Cupple Sessions</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 rounded-full"
            onClick={() => createCouplesSession.mutate()}
            disabled={createCouplesSession.isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {sessions && Array.isArray(sessions) ? 
            sessions
              .filter((session) => session.type === "couples")
              .slice(0, 5)
              .map((session) => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(`/session/${session.id}`)}
                  onMouseEnter={() => {
                    // Prefetch session data on hover for faster navigation
                    queryClient.prefetchQuery({ queryKey: [`/api/sessions/${session.id}`] });
                    queryClient.prefetchQuery({ queryKey: [`/api/sessions/${session.id}/messages`] });
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="block">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                  </div>
                </Button>
              )) : null}
          
          {(!sessions || !Array.isArray(sessions) || 
            sessions.filter((session) => session.type === "couples").length === 0) && (
            <p className="text-xs text-muted-foreground px-3 py-2">No couples sessions yet</p>
          )}
        </div>
      </div>
      
      <div className="mt-auto pt-6">
        <Separator className="my-4" />
        <Link href="/settings">
          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </Button>
      </div>
    </nav>
  );
}
