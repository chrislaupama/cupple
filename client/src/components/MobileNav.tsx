import { useLocation } from "wouter";
import { Users, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function MobileNav() {
  const [location] = useLocation();
  const { toast } = useToast();

  // Create new session mutation
  const createSession = useMutation({
    mutationFn: async (type: "couples" | "private") => {
      try {
        // Log for debugging
        console.log(`Creating new ${type} session via mobile nav`);
        
        // Make API request
        const response = await apiRequest("POST", "/api/sessions", {
          title: `${type === "private" ? "Private" : "Couples"} Session`,
          type
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to create ${type} session:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      // Navigate directly to the session
      window.location.href = `/session/${data.id}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle clicks directly instead of using links
  const handleCouplesClick = () => {
    // Always create new session when clicked
    createSession.mutate("couples");
  };

  const handlePrivateClick = () => {
    // Always create new session when clicked
    createSession.mutate("private");
  };

  return (
    <nav className="md:hidden border-t bg-background py-2">
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={handleCouplesClick}
          disabled={createSession.isPending}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/couples" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <Users className="h-5 w-5" />
          <span className="text-xs mt-1">Couples</span>
        </button>
        <button
          onClick={handlePrivateClick}
          disabled={createSession.isPending}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/private" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Private</span>
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/history" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <Clock className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
      </div>
    </nav>
  );
}
