import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";

interface PermitIntel {
  required_permits: string[];
  submission_format: string;
  processing_time_days: number;
  fee_structure: Record<string, string>;
  special_requirements: string[];
  climate_zone: string;
  seismic_zone: string;
  wind_zone: string;
  snow_load_requirements: string;
  fire_code_version: string;
}

export function PermitRulesPanel() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [projectType, setProjectType] = useState("");
  const [permitIntel, setPermitIntel] = useState<PermitIntel | null>(null);
  const { toast } = useToast();

  const getPermitRules = async () => {
    if (!state || !projectType) {
      toast({
        title: "Missing Information",
        description: "Please provide State and Project Type",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-permit-code-intelligence", {
        body: { state, municipality, projectType }
      });

      if (error) throw error;

      setPermitIntel(data);
      toast({
        title: "Permit Rules Retrieved",
        description: "Regional requirements loaded"
      });
    } catch (error) {
      console.error("Error getting permit rules:", error);
      toast({
        title: "Error",
        description: "Failed to get permit rules",
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
          <FileText className="h-5 w-5" />
          Permit Rules by Region
        </CardTitle>
        <CardDescription>
          AI-powered permit and code intelligence
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">State</label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., FL"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Municipality</label>
            <Input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="e.g., Miami"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Project Type</label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g., Kitchen Remodel"
            />
          </div>
        </div>

        <Button onClick={getPermitRules} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Permit Requirements
        </Button>

        {permitIntel && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Required Permits</h3>
              <div className="flex flex-wrap gap-2">
                {permitIntel.required_permits.map((permit, i) => (
                  <span key={i} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                    {permit}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{permitIntel.processing_time_days} days</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm font-medium">{permitIntel.submission_format}</div>
                <div className="text-sm text-muted-foreground">Submission Format</div>
              </div>
            </div>

            {permitIntel.special_requirements.length > 0 && (
              <div className="p-4 border rounded-lg bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive">Special Requirements</h3>
                <ul className="space-y-1">
                  {permitIntel.special_requirements.map((req, i) => (
                    <li key={i} className="text-sm">• {req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Climate Zone</div>
                <div className="font-medium">{permitIntel.climate_zone}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Wind Zone</div>
                <div className="font-medium">{permitIntel.wind_zone}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Seismic Zone</div>
                <div className="font-medium">{permitIntel.seismic_zone}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Fire Code</div>
                <div className="font-medium">{permitIntel.fire_code_version}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
