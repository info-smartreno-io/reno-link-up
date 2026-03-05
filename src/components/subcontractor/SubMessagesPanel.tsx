import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, User, Building, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useSubcontractorMessages, SubcontractorMessage } from "@/hooks/useSubcontractorMessages";

interface SubMessagesPanelProps {
  projectId?: string;
  bidPackageId?: string;
  currentUserType: "subcontractor" | "coordinator" | "pm" | "admin";
  projectName?: string;
}

const senderTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  subcontractor: { label: "Sub", color: "bg-blue-500", icon: Building },
  coordinator: { label: "PC", color: "bg-purple-500", icon: User },
  pm: { label: "PM", color: "bg-green-500", icon: User },
  admin: { label: "Admin", color: "bg-red-500", icon: User },
};

export function SubMessagesPanel({
  projectId,
  bidPackageId,
  currentUserType,
  projectName,
}: SubMessagesPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useSubcontractorMessages(projectId, bidPackageId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    sendMessage.mutate({
      message: newMessage.trim(),
      senderType: currentUserType,
    });
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Project Messages</span>
          {projectName && (
            <Badge variant="outline" className="font-normal">
              {projectName}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          All messages are visible to Admin, Project Coordinator, Project Manager, and Subcontractor
        </p>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: SubcontractorMessage }) {
  const config = senderTypeConfig[message.sender_type] || senderTypeConfig.admin;
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), "MMM d, h:mm a")}
          </span>
        </div>
        <div className="bg-muted rounded-lg p-3 text-sm">
          {message.message}
        </div>
        {message.attachments?.length > 0 && (
          <div className="flex gap-2 mt-2">
            {message.attachments.map((att: any, idx: number) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Paperclip className="h-3 w-3" />
                {att.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
