import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/contractor/StatusBadge";
import { format } from "date-fns";
import { MapPin, Calendar, DollarSign, User, FileText } from "lucide-react";

interface ProjectOverviewProps {
  project: any;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{project.location || "Not specified"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Client</p>
              <p className="text-sm text-muted-foreground">{project.client_name || "Not specified"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Project Type</p>
              <p className="text-sm text-muted-foreground">{project.project_type || "General"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Estimated Value</p>
              <p className="text-sm text-muted-foreground">
                {project.estimated_value ? `$${Number(project.estimated_value).toLocaleString()}` : "TBD"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Deadline</p>
              <p className="text-sm text-muted-foreground">
                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "No deadline"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status & Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Current Status</p>
            <StatusBadge value={project.status} />
          </div>
          {project.description && (
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
