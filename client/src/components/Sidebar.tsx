import { Link, useLocation } from "wouter";
import { Calendar, HelpCircle, Settings, Users, User } from "lucide-react";
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
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Session Types</h2>
        <div className="space-y-1">
          <Link href="/couples">
            <Button
              variant={location === "/couples" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Couples</span>
            </Button>
          </Link>
          <Link href="/private">
            <Button
              variant={location === "/private" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Private</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {sessions && Array.isArray(sessions) && sessions.length > 0 && (
        <>
          {/* Private Sessions */}
          {sessions.filter((session: SessionType) => session.type === "private").length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Private Sessions</h2>
              <div className="space-y-1">
                {sessions
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
              </div>
            </div>
          )}

          {/* Couples Sessions */}
          {sessions.filter((session: SessionType) => session.type === "couples").length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Couples Sessions</h2>
              <div className="space-y-1">
                {sessions
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
              </div>
            </div>
          )}
        </>
      )}
      
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
