import { Link, useLocation } from "wouter";
import { Users, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden border-t bg-background py-2">
      <div className="grid grid-cols-3 gap-1">
        <Link href="/couples">
          <a className={cn(
            "flex flex-col items-center justify-center py-2", 
            location === "/couples" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Couples</span>
          </a>
        </Link>
        <Link href="/private">
          <a className={cn(
            "flex flex-col items-center justify-center py-2", 
            location === "/private" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Private</span>
          </a>
        </Link>
        <Link href="/history">
          <a className={cn(
            "flex flex-col items-center justify-center py-2", 
            location === "/history" 
              ? "text-primary" 
              : "text-muted-foreground"
          )}>
            <Clock className="h-5 w-5" />
            <span className="text-xs mt-1">History</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
