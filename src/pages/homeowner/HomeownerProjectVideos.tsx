import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function HomeownerProjectVideos() {
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
      <h1 className="text-xl font-semibold text-foreground">Project Videos</h1>
      <p className="text-sm text-muted-foreground">
        Walkthroughs and short clips will live here so estimators and contractors can understand the space without extra site visits.
      </p>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Video uploads for this project will be organized here once your SmartReno team starts building your scope.
        </CardContent>
      </Card>
    </div>
  );
}

