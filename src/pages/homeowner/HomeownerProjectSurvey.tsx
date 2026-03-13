import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Once uploaded, these documents will be available to your estimator and contractors so they can account for lot lines, easements, and buildable area.
        </CardContent>
      </Card>
    </div>
  );
}

