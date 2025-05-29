import { useLocation } from "wouter";
import { Users, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location, navigate] = useLocation();

  // Client-side navigation functions
  const goToHome = () => {
    navigate("/");
  };
  
  const goToCouples = () => {
    navigate("/couples");
  };
  
  const goToPersonal = () => {
    navigate("/private");
  };

  return (
    <nav className="md:hidden border-t bg-background py-2">
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={goToCouples}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/couples" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <Users className="h-5 w-5" />
          <span className="text-xs mt-1">Cupple</span>
        </button>
        <button
          onClick={goToPersonal}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/private" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Personal</span>
        </button>
        <button
          onClick={goToHome}
          className={cn(
            "flex flex-col items-center justify-center py-2 bg-transparent border-none", 
            location === "/" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
      </div>
    </nav>
  );
}