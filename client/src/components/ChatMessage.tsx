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
  
  if (isAi) {
    avatarContent = (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Brain className="h-4 w-4" />
      </div>
    );
  } else if (isUser) {
    avatarContent = (
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender?.imageUrl} alt="Your avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
  } else if (isPartner) {
    avatarContent = (
      <Avatar className="h-8 w-8">
        <AvatarFallback>P</AvatarFallback>
      </Avatar>
    );
  }
  
  // Format message content with paragraphs
  const formattedContent = message.content.split('\n').map((paragraph, index) => (
    paragraph ? <p key={index} className="mb-2 last:mb-0">{paragraph}</p> : <br key={index} />
  ));
  
  // ChatGPT style: User messages on right, AI and partner messages on left with full width
  if (isUser) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8 flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%]">
          <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            {formattedContent}
          </div>
        </div>
      </div>
    );
  }
  
  // AI or partner message (left-aligned, full width container but content is limited)
  const senderName = isAi ? "AI Therapist" : (message.sender?.name || "Partner");
  
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 flex">
      <div className="mr-4 flex-shrink-0 mt-1">
        {avatarContent}
      </div>
      
      <div className="max-w-[85%] md:max-w-[80%]">
        <div className="text-sm font-medium mb-1">{senderName}</div>
        <div className="space-y-1">
          {formattedContent}
        </div>
      </div>
    </div>
  );
}
