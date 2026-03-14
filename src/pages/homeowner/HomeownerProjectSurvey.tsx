import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";

export default function HomeownerProjectSurvey() {
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
      <h1 className="text-xl font-semibold text-foreground">Survey & Site Documents</h1>
      <p className="text-sm text-muted-foreground">
        Property surveys, zoning documents, and other site information will be collected here when they&apos;re needed for your project.
      </p>
      <Card className="border-dashed">
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
          <p>
            Once uploaded, these documents will be available to your estimator and contractors so they can account for lot lines, easements, and buildable area.
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

