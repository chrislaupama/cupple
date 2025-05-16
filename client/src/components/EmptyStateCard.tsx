import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function EmptyStateCard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const createSession = useMutation({
    mutationFn: async (type: "private" | "couples") => {
      setIsLoading(true);
      
      try {
        // Make a plain fetch request to create the session
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${type === "private" ? "Personal" : "Cupple"} Session`,
            type
          }),
          credentials: "include"
        });
        
        // If response is not OK, throw error
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create session: ${response.status} - ${errorText}`);
        }
        
        // Parse the response
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Session creation error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate the sessions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      // Use window.location for more reliable navigation
      if (data && data.id) {
        const sessionUrl = `/session/${data.id}`;
        console.log(`Navigation to new session: ${sessionUrl}`);
        window.location.href = sessionUrl;
      } else {
        console.error("Missing session ID in response:", data);
      }
      
      toast({
        title: "Success!",
        description: "Your new therapy session has been created."
      });
    },
    onError: (error) => {
      console.error("Failed to create session:", error);
      
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  return (
    <div className="flex items-center justify-center h-full px-4">
      <Card className="w-full max-w-md shadow-lg border-muted/40">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to cupple</CardTitle>
          <CardDescription className="text-base mt-2">
            Begin your therapeutic journey with one of our AI-powered sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 py-4">
          <Button
            onClick={() => createSession.mutate("private")}
            variant="outline"
            className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-muted/50 transition-colors"
            disabled={isLoading}
          >
            <User className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
            <span className="font-medium">Personal Session</span>
          </Button>
          
          <Button
            onClick={() => createSession.mutate("couples")}
            variant="outline"
            className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-muted/50 transition-colors"
            disabled={isLoading}
          >
            <Users className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
            <span className="font-medium">Cupple Session</span>
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Choose a session type to get started
        </CardFooter>
      </Card>
    </div>
  );
}