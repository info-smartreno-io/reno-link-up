import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Palette } from "lucide-react";

interface DesignPlan {
  design_plan: {
    style: string;
    materials: string[];
    fixtures: string[];
    color_palette?: string[];
    estimated_cost: string;
  };
  upgrade_path: string[];
  layout_suggestions?: string;
  vendor_recommendations?: string[];
}

export function HomePlusDesignStudio() {
  const [loading, setLoading] = useState(false);
  const [stylePreferences, setStylePreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] = useState("");
  const [design, setDesign] = useState<DesignPlan | null>(null);
  const { toast } = useToast();

  const generateDesign = async () => {
    if (!stylePreferences || !budget || !projectType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-design-recommender", {
        body: {
          stylePreferences,
          budget,
          projectType,
          roomPhotos: []
        }
      });

      if (error) throw error;

      setDesign(data);
      toast({
        title: "Design Plan Generated",
        description: "Your personalized Home+ design is ready"
      });
    } catch (error) {
      console.error("Error generating design:", error);
      toast({
        title: "Error",
        description: "Failed to generate design plan",
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
          <Palette className="h-5 w-5" />
          Home+ Design Studio
        </CardTitle>
        <CardDescription>
          AI-powered personalized design recommendations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Style Preferences</label>
          <Textarea
            value={stylePreferences}
            onChange={(e) => setStylePreferences(e.target.value)}
            placeholder="E.g., Modern farmhouse, minimalist, traditional..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Budget</label>
            <Input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="$25,000"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Project Type</label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="Kitchen remodel"
            />
          </div>
        </div>

        <Button onClick={generateDesign} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Design Plan
        </Button>

        {design && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <h3 className="font-semibold mb-2">Design Style: {design.design_plan.style}</h3>
              <div className="text-lg font-bold text-primary">{design.design_plan.estimated_cost}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Materials</h3>
              <ul className="space-y-1">
                {design.design_plan.materials.map((material, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {material}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Fixtures & Finishes</h3>
              <ul className="space-y-1">
                {design.design_plan.fixtures.map((fixture, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {fixture}</li>
                ))}
              </ul>
            </div>

            {design.design_plan.color_palette && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Color Palette</h3>
                <div className="flex flex-wrap gap-2">
                  {design.design_plan.color_palette.map((color, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted text-sm rounded">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {design.layout_suggestions && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-2">Layout Suggestions</h3>
                <p className="text-sm">{design.layout_suggestions}</p>
              </div>
            )}

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Premium Upgrade Path</h3>
              <ul className="space-y-1">
                {design.upgrade_path.map((upgrade, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {upgrade}</li>
                ))}
              </ul>
            </div>

            {design.vendor_recommendations && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Recommended Vendors</h3>
                <ul className="space-y-1">
                  {design.vendor_recommendations.map((vendor, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {vendor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
