import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { EmptyStateCard } from "@/components/EmptyStateCard";

export default function Home() {
  const { user } = useAuth();

  // Default home view (always use EmptyStateCard for consistent experience)
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmptyStateCard />
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
