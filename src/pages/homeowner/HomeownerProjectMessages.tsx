import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import ProjectMessaging from "@/components/ProjectMessaging";

export default function HomeownerProjectMessages() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Select a project to view messages.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Messages</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Communicate with your contractor and SmartReno team.
        </p>
      </div>
      <ProjectMessaging projectId={projectId} projectName="Project" />
    </div>
  );
}
