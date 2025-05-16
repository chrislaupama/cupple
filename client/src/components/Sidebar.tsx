import { Link, useLocation } from "wouter";
import { Plus, HelpCircle, Settings, Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SessionType = {
  id: number;
  title: string;
  type: string;
  updatedAt: string;
};

export function Sidebar() {
  const [location] = useLocation();

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/sessions"],
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
      
      {/* Private Sessions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Private Sessions</h2>
          <Link href="/private">
            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-full">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-1">
          {sessions && Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "private")
              .slice(0, 5)
              .map((session: SessionType) => (
                <Link href={`/session/${session.id}`} key={session.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="block">{session.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                    </div>
                  </Button>
                </Link>
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
          <Link href="/couples">
            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-full">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-1">
          {sessions && Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "couples")
              .slice(0, 5)
              .map((session: SessionType) => (
                <Link href={`/session/${session.id}`} key={session.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="block">{session.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                    </div>
                  </Button>
                </Link>
              ))}
          
          {(!sessions || !Array.isArray(sessions) || 
            sessions.filter((session: SessionType) => session.type === "couples").length === 0) && (
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
