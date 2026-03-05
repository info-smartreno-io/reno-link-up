import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle2, AlertCircle } from "lucide-react";

export function OperationsRunConsole() {
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const { toast } = useToast();

  const runDailyOperations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-runner', {
        body: {
          projectIds: ["demo-project-1", "demo-project-2"],
          runMode: "daily"
        }
      });

      if (error) throw error;

      setLastRun(data);
      toast({
        title: "Daily Operations Completed",
        description: `Completed ${data.completed_checks} checks across all projects`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operations Run Console</CardTitle>
        <CardDescription>
          Execute automated daily operations across all active projects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDailyOperations} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Running...</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Daily Operations
            </>
          )}
        </Button>

        {lastRun && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Last Run Results:</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Checks: {lastRun.completed_checks}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Messages: {lastRun.auto_messages_drafted}</span>
              </div>
            </div>

            {lastRun.timeline_flags && lastRun.timeline_flags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Timeline Flags:</p>
                <div className="space-y-1">
                  {lastRun.timeline_flags.map((flag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="mr-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {lastRun.subs_contacted > 0 && (
              <p className="text-sm text-muted-foreground">
                Subs contacted: {lastRun.subs_contacted}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}