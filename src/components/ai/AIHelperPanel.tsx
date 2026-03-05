import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, X } from "lucide-react";
import { AiContext } from "@/types/nav";
import { cn } from "@/lib/utils";

interface AIHelperPanelProps {
  context: AiContext;
  contextData?: Record<string, any>;
  className?: string;
  onClose?: () => void;
}

export function AIHelperPanel({ context, contextData, className, onClose }: AIHelperPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  const contextLabels: Record<AiContext, string> = {
    global: "SmartReno AI",
    sales: "Sales Coach AI",
    estimating: "Estimator AI",
    operations: "Operations AI",
    project: "Project AI"
  };

  const contextPlaceholders: Record<AiContext, string> = {
    global: "Ask me anything about SmartReno...",
    sales: "Get sales scripts, follow-up suggestions, next best actions...",
    estimating: "Check scope, flag risks, suggest upsells...",
    operations: "Generate SmartPlan, prioritize tasks...",
    project: "Ask about this project, timeline, or next steps..."
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Implement AI call with context
      // For now, just simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResponse("AI response will be implemented here with context: " + context);
    } catch (error) {
      console.error("AI error:", error);
      setResponse("Error getting AI response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("border-2 border-accent/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">{contextLabels[context]}</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {response && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            {response}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={contextPlaceholders[context]}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="w-full gap-2" 
            disabled={isLoading || !prompt.trim()}
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Thinking..." : "Ask AI"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
