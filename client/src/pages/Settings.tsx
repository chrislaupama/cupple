import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Settings() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/welcome");
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                        <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        Change Picture
                      </Button>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" value={user?.firstName || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" value={user?.lastName || ''} readOnly />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={user?.email || ''} readOnly />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Customize your therapy experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Settings</h3>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span>Email notifications for new messages</span>
                      </Label>
                      <Label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span>Session reminders</span>
                      </Label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy Settings</h3>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span>Allow data to be used for service improvement</span>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>
                    Permanent account actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div>
                      <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                      <p className="text-sm text-red-600/70 dark:text-red-400/70">
                        This will permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" className="mt-4 sm:mt-0">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
