import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatContainer } from "@/components/ChatContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type CuppleTherapyProps = {
  userId: string;
};

export default function CouplesTherapy({ userId }: CuppleTherapyProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Fetch existing Cupple therapy sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/sessions"],
    select: (data) => Array.isArray(data) ? data.filter((session: any) => session.type === "couples") : [],
  });
  
  // Create new session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions", {
        title: "Cupple Session",
        type: "couples"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      // Navigate to the new session
      navigate(`/session/${data.id}`);
      
      toast({
        title: "Success",
        description: "New session created.",
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
  
  // Get the most recent or active session
  const activeSession = sessions && sessions.length > 0 ? sessions[0] : null;
  
  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <Card className="w-full max-w-md shadow-lg border-muted/40">
          <CardContent className="pt-6 pb-6 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-medium mb-2">Start Couples Session</h2>
            <p className="text-muted-foreground mb-6">
              Begin your journey toward a healthier relationship.
            </p>
            
            <Button
              onClick={() => createSession.mutate()}
              className="w-full"
              disabled={createSession.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createSession.isPending ? "Creating..." : "New Session"}
            </Button>
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
        chatType="couples" 
      />
    </div>
  );
}
