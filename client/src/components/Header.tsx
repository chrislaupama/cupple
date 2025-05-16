import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon, ChevronDown, Settings, HelpCircle, LogOut } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "light" ? "dark" : "light");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const firstName = (user as any)?.firstName || "";
    const lastName = (user as any)?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}` || "U";
  };

  const displayName = user ? ((user as any)?.firstName || "") + " " + ((user as any)?.lastName || "") : "User";
  
  return (
    <header className="border-b bg-background py-4 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <Link href="/">
          <h1 className="text-xl font-semibold cursor-pointer">cupple</h1>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme} 
        >
          {resolvedTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none">
                <Avatar>
                  <AvatarImage 
                    src={(user as any)?.profileImageUrl || undefined} 
                    alt={displayName} 
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-medium">{displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help Center</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <a href="/api/logout">
                <DropdownMenuItem className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </a>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <a href="/api/login">Log In</a>
          </Button>
        )}
      </div>
    </header>
  );
}
