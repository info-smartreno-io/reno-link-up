import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calculator, ArrowRight } from "lucide-react";

export function CostEstimatorWidget() {
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [projectType, setProjectType] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [estimate, setEstimate] = useState<any>(null);
  const { toast } = useToast();

  const getEstimate = async () => {
    if (!projectType) {
      toast({
        title: "Missing Information",
        description: "Please select a project type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-cost-estimator-widget', {
        body: {
          zipCode,
          projectType,
          squareFootage: squareFootage ? parseInt(squareFootage) : null,
          roomCount: null
        }
      });

      if (error) throw error;

      setEstimate(data);
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Get a Free AI Estimate
        </CardTitle>
        <CardDescription>
          Instant cost range for your renovation project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>ZIP Code (Optional)</Label>
          <Input
            placeholder="07601"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Project Type *</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kitchen">Kitchen Remodel</SelectItem>
              <SelectItem value="bathroom">Bathroom Remodel</SelectItem>
              <SelectItem value="basement">Basement Finishing</SelectItem>
              <SelectItem value="addition">Home Addition</SelectItem>
              <SelectItem value="siding">Siding Replacement</SelectItem>
              <SelectItem value="windows">Window Replacement</SelectItem>
              <SelectItem value="full_renovation">Full Home Renovation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Square Footage (Optional)</Label>
          <Input
            type="number"
            placeholder="200"
            value={squareFootage}
            onChange={(e) => setSquareFootage(e.target.value)}
          />
        </div>

        <Button 
          onClick={getEstimate} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Calculating..." : "Get Instant Estimate"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {estimate && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-bold">
                  ${estimate.low_estimate?.toLocaleString()} - ${estimate.high_estimate?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mid-range: ${estimate.mid_estimate?.toLocaleString()}
              </p>
            </div>

            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-1">What's included:</p>
              <p className="text-muted-foreground">{estimate.explanation}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{estimate.next_steps}</p>
              <Button className="w-full" variant="default">
                {estimate.cta_message}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}