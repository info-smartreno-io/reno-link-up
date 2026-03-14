import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";

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
      <Card className="border-dashed">
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
          <p>
            As your design team uploads plans and renderings, this page will become the single source of truth for scopes and measurements.
          </p>
          <p className="text-xs">
            You can also find all project documents in one place in Files.
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/homeowner/files")}>
            <FolderOpen className="h-3.5 w-3.5" />
            View project files
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

