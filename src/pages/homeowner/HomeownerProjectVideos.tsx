import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";

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
      <Card className="border-dashed">
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
          <p>
            Video uploads for this project will be organized here once your SmartReno team starts building your scope.
          </p>
          <p className="text-xs">
            You can also find all project documents in Files.
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

