import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Calendar } from "lucide-react";

export function InspectionCenter() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [inspectionData, setInspectionData] = useState<any>(null);
  const { toast } = useToast();

  const analyzeInspection = async () => {
    if (!projectId) {
      toast({
        title: "Missing Project ID",
        description: "Please enter a project ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-inspection-intelligence', {
        body: {
          projectId,
          scope: { rooms: ["kitchen", "bathroom"] },
          timeline: [],
          recentWork: ["electrical", "plumbing"],
          inspectionHistory: []
        }
      });

      if (error) throw error;

      setInspectionData(data);
      toast({
        title: "Inspection Analysis Complete",
        description: `Next inspection: ${data.next_required_inspection}`,
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
        <CardTitle>Inspection Intelligence Center</CardTitle>
        <CardDescription>
          AI-powered inspection workflow management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Project ID</Label>
          <Input
            placeholder="Enter project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>

        <Button 
          onClick={analyzeInspection} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Analyzing...</>
          ) : (
            <>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Analyze Inspections
            </>
          )}
        </Button>

        {inspectionData && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Inspection Analysis:</h3>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Next Required</Label>
                <p className="text-sm font-medium">{inspectionData.next_required_inspection}</p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{inspectionData.schedule_recommendation}</span>
              </div>

              <div className="flex gap-2">
                <Badge variant={inspectionData.risk === 'low' ? 'default' : 'destructive'}>
                  Risk: {inspectionData.risk}
                </Badge>
                <Badge variant="outline">
                  Expected: {inspectionData.expected_outcome}
                </Badge>
              </div>

              {inspectionData.preparation_checklist && (
                <div>
                  <Label className="text-xs text-muted-foreground">Preparation Checklist</Label>
                  <ul className="mt-2 space-y-1 text-sm">
                    {inspectionData.preparation_checklist.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}