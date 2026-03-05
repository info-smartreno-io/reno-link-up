import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign } from "lucide-react";

interface CostModel {
  labor_multiplier: number;
  material_multiplier: number;
  permit_fee_multiplier: number;
  disposal_fee_multiplier: number;
  seasonal_factors: Record<string, number>;
  notes?: string;
}

export function RegionalCostIndexMap() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [costModel, setCostModel] = useState<CostModel | null>(null);
  const { toast } = useToast();

  const getCostModel = async () => {
    if (!state) {
      toast({
        title: "Missing Information",
        description: "Please provide a State",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-region-cost-model", {
        body: { state, county, city }
      });

      if (error) throw error;

      setCostModel(data);
      toast({
        title: "Cost Model Generated",
        description: "Regional cost multipliers calculated"
      });
    } catch (error) {
      console.error("Error getting cost model:", error);
      toast({
        title: "Error",
        description: "Failed to generate cost model",
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
          <DollarSign className="h-5 w-5" />
          Regional Cost Index
        </CardTitle>
        <CardDescription>
          AI-calculated regional cost multipliers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">State</label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., NJ"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">County</label>
            <Input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g., Bergen"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">City</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Paramus"
            />
          </div>
        </div>

        <Button onClick={getCostModel} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calculate Cost Index
        </Button>

        {costModel && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{costModel.labor_multiplier}x</div>
                <div className="text-sm text-muted-foreground">Labor Multiplier</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{costModel.material_multiplier}x</div>
                <div className="text-sm text-muted-foreground">Material Multiplier</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{costModel.permit_fee_multiplier}x</div>
                <div className="text-sm text-muted-foreground">Permit Fee Multiplier</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{costModel.disposal_fee_multiplier}x</div>
                <div className="text-sm text-muted-foreground">Disposal Fee Multiplier</div>
              </div>
            </div>

            {costModel.seasonal_factors && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Seasonal Factors</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(costModel.seasonal_factors).map(([season, factor]) => (
                    <div key={season} className="flex justify-between">
                      <span className="capitalize">{season}:</span>
                      <span className="font-medium">{factor}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {costModel.notes && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm">{costModel.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
