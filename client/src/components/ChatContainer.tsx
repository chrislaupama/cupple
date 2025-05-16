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
  
  // Cast to expected Session type
  const typedSession = session as Session;

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      sendMessage(content);
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
                ? "Begin your private therapy session. Your messages are confidential." 
                : "Begin your couples therapy session. Share and grow together."}
            </p>
          </div>
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} isPrivate={chatType === "private"} />
    </div>
  );
}

function ChatHeader({ session, type }: { session: Session, type: "couples" | "private" }) {
  return (
    <div className="border-b py-3 px-4 md:px-6 bg-background shadow-sm">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center">
          <h2 className="text-base font-medium truncate max-w-[260px] md:max-w-xs">
            {session.title || (type === "couples" ? "Couples Session" : "Private Session")}
          </h2>
          <Badge 
            variant="outline" 
            className="ml-2"
          >
            {type === "couples" ? "Couples" : "Private"}
          </Badge>
        </div>
        
        <div className="flex items-center">
          <Button size="sm" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatMessageList({ messages, userId }: { messages: Message[], userId: string }) {
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
      
      <div className="relative border-t p-4 md:p-6 bg-background">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
