import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function EmptyStateCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const createSession = useMutation({
    mutationFn: async (type: "private" | "couples") => {
      setIsLoading(true);
      
      try {
        console.log(`Creating new ${type} session...`);
        const response = await apiRequest("POST", "/api/sessions", {
          title: `${type === "private" ? "Private" : "Couples"} Session 1`,
          type,
        });
        
        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error creating session:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      // Use direct URL change instead of location setter
      // This ensures it works consistently on mobile
      window.location.href = `/session/${data.id}`;
      
      toast({
        title: "Session created",
        description: "Your new therapy session has been created."
      });
    },
    onError: () => {
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
            <span className="font-medium">Private Session</span>
          </Button>
          
          <Button
            onClick={() => createSession.mutate("couples")}
            variant="outline"
            className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-muted/50 transition-colors"
            disabled={isLoading}
          >
            <Users className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
            <span className="font-medium">Couples Session</span>
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Choose a session type to get started
        </CardFooter>
      </Card>
    </div>
  );
}