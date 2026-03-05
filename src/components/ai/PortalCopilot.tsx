import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CopilotRole = 
  | 'homeowner' 
  | 'foreman' 
  | 'pm' 
  | 'coordinator' 
  | 'subcontractor' 
  | 'estimator';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface PortalCopilotProps {
  role: CopilotRole;
  projectId?: string;
  userId?: string;
  contextData?: Record<string, any>;
  className?: string;
}

const roleConfig: Record<CopilotRole, { 
  title: string; 
  placeholder: string; 
  endpoint: string;
  color: string;
}> = {
  homeowner: {
    title: "Homeowner Support",
    placeholder: "Ask about your project status, timeline, or approvals...",
    endpoint: "ai-homeowner-support",
    color: "bg-blue-500",
  },
  foreman: {
    title: "Foreman Assistant",
    placeholder: "Ask about daily tasks, crew, materials, or reports...",
    endpoint: "ai-foreman-copilot",
    color: "bg-orange-500",
  },
  pm: {
    title: "PM Assistant",
    placeholder: "Ask about resources, scheduling, inspections, or change orders...",
    endpoint: "ai-pm-copilot",
    color: "bg-purple-500",
  },
  coordinator: {
    title: "Coordinator Assistant",
    placeholder: "Ask about task prioritization, scheduling, or homeowner communication...",
    endpoint: "ai-coordinator-copilot",
    color: "bg-green-500",
  },
  subcontractor: {
    title: "Sub Assistant",
    placeholder: "Ask about bids, scheduling, scope questions...",
    endpoint: "ai-sub-copilot",
    color: "bg-cyan-500",
  },
  estimator: {
    title: "Estimator Assistant",
    placeholder: "Ask about scope analysis, pricing, or risk flags...",
    endpoint: "ai-estimator-copilot",
    color: "bg-amber-500",
  },
};

export function PortalCopilot({ 
  role, 
  projectId, 
  userId,
  contextData,
  className 
}: PortalCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = roleConfig[role];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(config.endpoint, {
        body: {
          question: message,
          userId,
          projectId,
          contextData,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        role: "assistant",
        content: data.response || data.answer || "I'm not sure how to respond to that.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Copilot error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50",
          config.color,
          "hover:scale-105 transition-transform"
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-[380px] shadow-2xl z-50 transition-all duration-200",
      isMinimized ? 'h-14' : 'h-[520px]',
      className
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between py-3 px-4 border-b rounded-t-lg",
        config.color,
        "text-white"
      )}>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-3.5rem)]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className={cn("h-12 w-12 mx-auto mb-3", config.color.replace('bg-', 'text-'))} />
                <p className="mb-2 font-medium">Hi! I'm your {config.title}.</p>
                <p className="text-xs">{config.placeholder}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                      config.color
                    )}>
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center",
                    config.color
                  )}>
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                placeholder={config.placeholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="text-sm"
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading || !message.trim()}
                size="icon"
                className={config.color}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
