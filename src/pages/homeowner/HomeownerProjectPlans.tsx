import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function HomeownerProjectPlans() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-xl font-semibold text-foreground">Plans & 3D Renderings</h1>
      <p className="text-sm text-muted-foreground">
        Architectural drawings, 3D views, and design packages for this project will be stored here.
      </p>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          As your design team uploads plans and renderings, this page will become the single source of truth for scopes and measurements.
        </CardContent>
      </Card>
    </div>
  );
}

