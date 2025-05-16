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
  let bubbleClass;
  
  if (isAi) {
    avatarContent = (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Brain className="text-primary h-4 w-4" />
      </div>
    );
    nameBadge = "Dr. AI Therapist";
    bubbleClass = "bg-background dark:bg-gray-800";
  } else if (isUser) {
    avatarContent = (
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender?.imageUrl} alt="Your avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
    nameBadge = "You";
    bubbleClass = "bg-primary text-primary-foreground";
  } else if (isPartner) {
    avatarContent = (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
        <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">P</span>
      </div>
    );
    nameBadge = message.sender?.name || "Partner";
    bubbleClass = "bg-gray-100 dark:bg-gray-700";
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
        bubbleClass
      )}>
        <p className={cn(
          "font-semibold text-sm",
          isAi && "text-primary dark:text-primary/90",
          isPartner && "text-gray-600 dark:text-gray-300"
        )}>
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
