import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ChatInputProps = {
  onSendMessage: (content: string) => void;
  isPrivate: boolean;
};

export function ChatInput({ onSendMessage, isPrivate }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="relative p-4 md:p-6 bg-background">
      <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl">
        <div className="relative flex items-center rounded-xl border shadow-sm bg-background">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 resize-none border-0 bg-transparent px-3 py-3 focus-visible:outline-none focus-visible:ring-0 min-h-[52px] max-h-[200px] placeholder:pt-[2px]"
            placeholder="Ask anything..."
            rows={1}
            style={{
              boxShadow: 'none',
              overflow: 'auto'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          {isPrivate && (
            <div className="flex-shrink-0 px-2 self-center">
              <Badge variant="outline" className="mr-2 py-1 px-2.5 rounded-full bg-background border-muted-foreground/30 text-muted-foreground font-normal text-xs">
                Private
              </Badge>
            </div>
          )}
          <div className="flex-shrink-0 px-3">
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
