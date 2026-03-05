import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar } from "lucide-react";

interface AvailabilityResult {
  availability_score: number;
  next_open_window: string;
  recommended_project_types: string[];
}

export function AvailabilityPanel() {
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const { toast } = useToast();

  const checkAvailability = async () => {
    if (!contractorId) {
      toast({
        title: "Missing Information",
        description: "Please provide a Contractor ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-contractor-availability", {
        body: {
          contractorId,
          calendar: [],
          projectLoad: [],
          crewCount: 2,
          historicalPatterns: []
        }
      });

      if (error) throw error;

      setAvailability(data);
      toast({
        title: "Availability Calculated",
        description: "Contractor availability updated"
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      toast({
        title: "Error",
        description: "Failed to check availability",
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
          <Calendar className="h-5 w-5" />
          Contractor Availability
        </CardTitle>
        <CardDescription>
          AI-predicted contractor capacity
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Contractor ID</label>
          <Input
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            placeholder="Enter contractor ID"
          />
        </div>

        <Button onClick={checkAvailability} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Check Availability
        </Button>

        {availability && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">
                  {(availability.availability_score * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Availability Score</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{availability.next_open_window}</div>
                <div className="text-sm text-muted-foreground">Next Open Window</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Project Types</h3>
              <div className="flex flex-wrap gap-2">
                {availability.recommended_project_types.map((type, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
