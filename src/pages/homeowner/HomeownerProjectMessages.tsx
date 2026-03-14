import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectMessaging from "@/components/ProjectMessaging";
import { useHomeownerProjects } from "@/hooks/useHomeownerData";

export default function HomeownerProjectMessages() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: projects } = useHomeownerProjects();
  const [chatAudience, setChatAudience] = useState<string>("support");

  useEffect(() => {
    if (!projectId && projects && projects.length > 0) {
      // If homeowner hits /homeowner/messages without a projectId in the URL,
      // automatically take them to the latest project messages.
      navigate(`/homeowner/projects/${projects[0].id}/messages`, { replace: true });
    }
  }, [projectId, projects, navigate]);

  if (!projectId) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 space-y-6 text-muted-foreground">
            <div className="space-y-2 text-center">
              <h3 className="text-sm font-medium text-foreground">Messages</h3>
              <p className="text-sm text-muted-foreground">
                Once you start a renovation project, you&apos;ll be able to message your SmartReno team
                and contractors here. In the meantime, you can reach out to support.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <Label className="text-xs text-muted-foreground">
                Who would you like to connect with?
              </Label>
              <Select value={chatAudience} onValueChange={setChatAudience}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">SmartReno support</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Message your project manager or contractor from your project page once one is assigned.
              </p>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate("/homeowner-intake")}
                >
                  Start your renovation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/homeowner/schedule-visit")}
                >
                  Schedule a site visit
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="tel:12017889502">Call support</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
