import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function HomeownerProjectPhotos() {
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
      <h1 className="text-xl font-semibold text-foreground">Project Photos</h1>
      <p className="text-sm text-muted-foreground">
        Photos for this renovation will live here once your project moves into estimating and construction.
      </p>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          This view will show photos grouped by project and phase so you and your contractors can reference progress and existing conditions.
        </CardContent>
      </Card>
    </div>
  );
}

