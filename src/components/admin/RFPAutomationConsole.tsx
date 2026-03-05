import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

interface RFPResult {
  status: string;
  follow_up_scheduled: boolean;
  next_follow_up: string;
  message: string;
}

export function RFPAutomationConsole() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [result, setResult] = useState<RFPResult | null>(null);
  const { toast } = useToast();

  const sendRFP = async () => {
    if (!projectId || !contractorId) {
      toast({
        title: "Missing Information",
        description: "Please provide both Project ID and Contractor ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rfp-sender", {
        body: {
          projectId,
          contractorId,
          projectSummary: "Kitchen remodel in Bergen County - $50k-$80k budget",
          attachments: []
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "RFP Sent",
        description: "Automated RFP sent to contractor"
      });
    } catch (error) {
      console.error("Error sending RFP:", error);
      toast({
        title: "Error",
        description: "Failed to send RFP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          RFP Automation Console
        </CardTitle>
        <CardDescription>
          Automatically send and follow up on RFPs
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Project ID</label>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Contractor ID</label>
          <Input
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            placeholder="Enter contractor ID"
          />
        </div>

        <Button onClick={sendRFP} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Automated RFP
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{result.status}</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{result.next_follow_up}</div>
                <div className="text-sm text-muted-foreground">Next Follow-Up</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">Personalized Message</h3>
              <p className="text-sm whitespace-pre-wrap">{result.message}</p>
            </div>

            {result.follow_up_scheduled && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">
                  ✓ Follow-up reminder scheduled for {result.next_follow_up}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
