import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import CouplesTherapy from "@/pages/CouplesTherapy";
import PrivateTherapy from "@/pages/PrivateTherapy";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/welcome");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="w-8 h-8 border-4 border-foreground/30 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Navigate effect will redirect to welcome
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs 
            defaultValue={location === "/private" ? "private" : "couples"} 
            className="flex-1 flex flex-col"
          >
            <TabsList className="md:hidden mx-4 mt-2 justify-center">
              <TabsTrigger value="couples" className="flex-1">Couples</TabsTrigger>
              <TabsTrigger value="private" className="flex-1">Private</TabsTrigger>
            </TabsList>
            <TabsContent value="couples" className="flex-1 p-0 m-0">
              <CouplesTherapy userId={(user as any)?.id || ""} />
            </TabsContent>
            <TabsContent value="private" className="flex-1 p-0 m-0">
              <PrivateTherapy userId={(user as any)?.id || ""} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
