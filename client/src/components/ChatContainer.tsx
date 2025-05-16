import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useChat, Message, Session } from "@/hooks/useChat";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChatContainerProps = {
  sessionId: number;
  userId: string;
  chatType: "couples" | "private"; // Using same database values, but displaying as "Cupple" and "Personal"
};

export function ChatContainer({ sessionId, userId, chatType }: ChatContainerProps) {
  const { messages, session, isLoading, sendMessage, isStreaming } = useChat(sessionId, userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Scroll to bottom when messages change or when streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);
  
  if (isLoading) {
    return <ChatSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">Session not found.</p>
      </div>
    );
  }
  
  // Cast to expected Session type
  const typedSession = session as Session;

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      sendMessage(content);
      // Scroll to bottom after sending a message
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <ChatHeader session={typedSession} type={chatType} />
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList messages={messages} userId={userId} />
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
            <p className="text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-muted-foreground max-w-md">
              {chatType === "private" 
                ? "Begin your personal therapy session. Your messages are confidential." 
                : "Begin your cupple therapy session. Share and grow together."}
            </p>
          </div>
        )}
        {/* Invisible element for scrolling to the bottom */}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isPrivate={chatType === "private"} />
    </div>
  );
}

function ChatHeader({ session, type }: { session: Session, type: "couples" | "private" }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleRenameSession = async () => {
    if (!newTitle || !newTitle.trim()) return;
    
    try {
      await apiRequest("PATCH", `/api/sessions/${session.id}`, {
        title: newTitle.trim()
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${session.id}`] });
      
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
  
  const handleDeleteSession = async () => {
    try {
      await apiRequest("DELETE", `/api/sessions/${session.id}`);
      
      toast({
        title: "Session deleted",
        description: "Your session has been deleted successfully."
      });
      
      // Invalidate the queries
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      
      // Navigate to home
      setLocation("/");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="border-b py-3 px-4 md:px-6 bg-background shadow-sm">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center">
          <h2 className="text-base font-medium truncate max-w-[260px] md:max-w-xs">
            {session.title || (type === "couples" ? "Cupple Session" : "Personal Session")}
          </h2>
          <Badge 
            variant="outline" 
            className="ml-2"
          >
            {type === "couples" ? "Cupple" : "Personal"}
          </Badge>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setNewTitle(session.title);
                setIsRenameDialogOpen(true);
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
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
              <Label htmlFor="name">Session name</Label>
              <Input
                id="name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={type === "couples" ? "Cupple Session" : "Personal Session"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSession}>Save Changes</Button>
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
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChatMessageList({ messages, userId }: { messages: Message[], userId: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isUser={message.senderId === userId}
          isPartner={message.senderId !== userId && !message.isAi}
          isAi={message.isAi}
        />
      ))}
      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="border-b py-3 px-4 md:px-6 bg-background shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 ml-2" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="px-4 py-6 md:px-6 lg:px-8 flex">
            <Skeleton className="h-8 w-8 rounded-full mr-4 flex-shrink-0" />
            <div className="space-y-2 max-w-[80%]">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </div>
          
          <div className="px-4 py-6 md:px-6 lg:px-8 flex justify-end">
            <div className="max-w-[80%] md:max-w-[70%]">
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          </div>
          
          <div className="px-4 py-6 md:px-6 lg:px-8 flex">
            <Skeleton className="h-8 w-8 rounded-full mr-4 flex-shrink-0" />
            <div className="space-y-2 max-w-[80%]">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative p-4 md:p-6 bg-background">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
