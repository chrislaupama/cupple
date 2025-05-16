import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useChat, Message, Session } from "@/hooks/useChat";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatContainerProps = {
  sessionId: number;
  userId: string;
  chatType: "couples" | "private";
};

export function ChatContainer({ sessionId, userId, chatType }: ChatContainerProps) {
  const { messages, session, isLoading, isConnected, sendMessage } = useChat(sessionId, userId);
  
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

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      sendMessage(content);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
      <ChatHeader session={session} type={chatType} />
      <ChatMessageList messages={messages} userId={userId} />
      <ChatInput onSendMessage={handleSendMessage} isPrivate={chatType === "private"} />
    </div>
  );
}

function ChatHeader({ session, type }: { session: Session, type: "couples" | "private" }) {
  return (
    <div className="border-b border-border p-4 bg-background shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold font-mono">
            {session.title || (type === "couples" ? "Couples Therapy Session" : "Private Therapy Session")}
          </h2>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-3",
              type === "couples" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            )}
          >
            {type === "couples" ? "Active" : "Private"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="ghost">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        With Dr. AI Therapist • {type === "private" ? "Your partner cannot see these messages" : "Started recently"}
      </p>
    </div>
  );
}

function ChatMessageList({ messages, userId }: { messages: Message[], userId: string }) {
  return (
    <ScrollArea className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isUser={message.senderId === userId}
            isPartner={message.senderId !== userId && !message.isAi}
            isAi={message.isAi}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
      <div className="border-b border-border p-4 bg-background">
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        <div className="flex items-start">
          <Skeleton className="h-8 w-8 rounded-full mr-3" />
          <Skeleton className="h-24 w-3/4 rounded-lg" />
        </div>
        
        <div className="flex items-start justify-end">
          <Skeleton className="h-16 w-2/3 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full ml-3" />
        </div>
        
        <div className="flex items-start">
          <Skeleton className="h-8 w-8 rounded-full mr-3" />
          <Skeleton className="h-32 w-3/4 rounded-lg" />
        </div>
      </div>
      
      <div className="border-t border-border p-4 bg-background">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
