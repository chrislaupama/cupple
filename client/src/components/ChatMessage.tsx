import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { Message } from "@/hooks/useChat";

type ChatMessageProps = {
  message: Message;
  isUser: boolean;
  isPartner: boolean;
  isAi: boolean;
};

export function ChatMessage({ message, isUser, isPartner, isAi }: ChatMessageProps) {
  let avatarContent;
  let nameBadge;
  
  if (isAi) {
    avatarContent = (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Brain className="h-4 w-4" />
      </div>
    );
    nameBadge = "AI Therapist";
  } else if (isUser) {
    avatarContent = (
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender?.imageUrl} alt="Your avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
    nameBadge = "You";
  } else if (isPartner) {
    avatarContent = (
      <Avatar className="h-8 w-8">
        <AvatarFallback>P</AvatarFallback>
      </Avatar>
    );
    nameBadge = message.sender?.name || "Partner";
  }
  
  // Format message content with paragraphs
  const formattedContent = message.content.split('\n').map((paragraph, index) => (
    paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
  ));
  
  return (
    <div className={cn(
      "flex items-start",
      isUser && "justify-end"
    )}>
      {!isUser && (
        <div className="mr-3 flex-shrink-0">
          {avatarContent}
        </div>
      )}
      
      <div className={cn(
        "rounded-lg p-4 max-w-[80%] shadow-sm",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <p className="font-semibold text-sm">
          {nameBadge}
        </p>
        <div className="mt-1 space-y-2">
          {formattedContent}
        </div>
      </div>
      
      {isUser && (
        <div className="ml-3 flex-shrink-0">
          {avatarContent}
        </div>
      )}
    </div>
  );
}
