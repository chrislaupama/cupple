import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Smile, Send } from "lucide-react";
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
    <div className="border-t border-border p-4 bg-background">
      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
        <div className="flex-1 bg-muted rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
            placeholder="Type your message..."
            rows={2}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-1">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div>
              {isPrivate && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Private Message
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button type="submit" size="icon" className="h-10 w-10">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
