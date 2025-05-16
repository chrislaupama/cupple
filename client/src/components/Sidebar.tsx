import { Link, useLocation } from "wouter";
import { 
  Plus, 
  HelpCircle, 
  Settings, 
  Users, 
  User, 
  MoreVertical, 
  Pencil, 
  Trash2 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<SessionType | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/sessions"],
  });
  
  // Function to handle session renaming
  const handleRenameSession = (session: SessionType) => {
    setSessionToRename(session);
    setNewTitle(session.title);
    setIsRenameDialogOpen(true);
  };
  
  // Function to save the renamed session
  const saveRenamedSession = async () => {
    if (!sessionToRename || !newTitle.trim()) return;
    
    try {
      await apiRequest("PATCH", `/api/sessions/${sessionToRename.id}`, {
        title: newTitle.trim()
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      toast({
        title: "Session renamed",
        description: "Your session has been renamed successfully."
      });
      
      setIsRenameDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle session deletion
  const handleDeleteSession = (sessionId: number) => {
    setSessionToDelete(sessionId);
    setIsDeleteDialogOpen(true);
  };
  
  // Function to confirm and execute session deletion
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/sessions/${sessionToDelete}`);
      
      toast({
        title: "Session deleted",
        description: "Your session has been deleted successfully."
      });
      
      // Invalidate the queries
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      // If we're currently viewing the deleted session, navigate home
      if (location.includes(`/session/${sessionToDelete}`)) {
        navigate("/");
      }
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Create new private session
  const createPrivateSession = useMutation({
    mutationFn: async () => {
      const privateCount = Array.isArray(sessions) 
        ? sessions.filter(s => s.type === "private").length + 1
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
        variant: "destructive",
      });
    }
  });
  
  // Create new couples session
  const createCouplesSession = useMutation({
    mutationFn: async () => {
      const couplesCount = Array.isArray(sessions) 
        ? sessions.filter(s => s.type === "couples").length + 1
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
      
      {/* Private Sessions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Private Sessions</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 rounded-full"
            onClick={() => createPrivateSession.mutate()}
            disabled={createPrivateSession.isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {sessions && Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "private")
              .slice(0, 5)
              .map((session: SessionType) => (
                <div 
                  key={session.id}
                  className="relative group"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start pr-10"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="block">{session.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                    </div>
                  </Button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(session);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
          {sessions && Array.isArray(sessions) && 
            sessions
              .filter((session: SessionType) => session.type === "couples")
              .slice(0, 5)
              .map((session: SessionType) => (
                <div 
                  key={session.id}
                  className="relative group"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start pr-10"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="block">{session.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</span>
                    </div>
                  </Button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(session);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
    
    {/* Rename Dialog */}
    <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
          <DialogDescription>
            Enter a new name for this therapy session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="session-name">Session name</Label>
            <Input
              id="session-name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={sessionToRename?.type === "couples" ? "Couples Session" : "Private Session"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveRenamedSession}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this therapy session and all its messages. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDeleteSession}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
