import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatContainer } from "@/components/ChatContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type PrivateTherapyProps = {
  userId: string;
};

export default function PrivateTherapy({ userId }: PrivateTherapyProps) {
  const [sessionTitle, setSessionTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch existing private therapy sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/sessions"],
    select: (data) => Array.isArray(data) ? data.filter((session: any) => session.type === "private") : [],
  });
  
  // Create new session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions", {
        title: sessionTitle || "Private Therapy Session",
        type: "private",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setSessionTitle("");
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "New private therapy session created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateSession = () => {
    createSession.mutate();
  };
  
  // Get the most recent or active session
  const activeSession = sessions && sessions.length > 0 ? sessions[0] : null;
  
  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Start Private Session</h2>
            <p className="text-muted-foreground mb-6">
              Have a private conversation in a secure, confidential space.
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Private Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Private Session</DialogTitle>
                  <DialogDescription>
                    Your private sessions are confidential and not shared with your partner.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="session-title">Session Title</Label>
                    <Input
                      id="session-title"
                      placeholder="e.g., Personal Reflections"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    onClick={handleCreateSession}
                    disabled={createSession.isPending}
                  >
                    {createSession.isPending ? "Creating..." : "Create Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-hidden">
      <ChatContainer 
        sessionId={activeSession.id} 
        userId={userId} 
        chatType="private" 
      />
    </div>
  );
}
