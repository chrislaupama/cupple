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
    <div className="border-t p-4 bg-background">
      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
        <div className="flex-1 bg-muted rounded-lg p-3 focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
            placeholder="Type your message..."
            rows={2}
          />
          <div className="flex justify-end items-center mt-2">
            {isPrivate && (
              <Badge variant="outline">
                Private Message
              </Badge>
            )}
          </div>
        </div>
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
