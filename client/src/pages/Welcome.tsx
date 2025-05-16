import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Users, User, Brain } from "lucide-react";

export default function Welcome() {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  const handleStartClick = () => {
    window.location.href = "/api/login";
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-muted/20 p-6">
        <div className="max-w-3xl w-full">
          <h1 className="text-3xl font-bold font-mono text-center mb-6">Welcome to ConnectTherapy</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Couple image */}
            <Card className="overflow-hidden shadow-lg">
              <div className="h-64 w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                  alt="Couple in therapy" 
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
            
            {/* Therapist image */}
            <Card className="overflow-hidden shadow-lg">
              <div className="h-64 w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                  alt="Therapy session" 
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>
          
          <Card className="mb-8 shadow-md">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">How ConnectTherapy Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Couples Sessions</h3>
                  <p className="text-sm text-muted-foreground">Work together with your partner and our AI therapist in joint sessions</p>
                </div>
                
                <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Private Sessions</h3>
                  <p className="text-sm text-muted-foreground">Have confidential one-on-one sessions with our AI therapist</p>
                </div>
                
                <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">AI-Powered Guidance</h3>
                  <p className="text-sm text-muted-foreground">Get personalized therapeutic guidance based on your unique situation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button 
              size="lg"
              onClick={handleStartClick}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8"
            >
              Start Your Therapy Journey
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
