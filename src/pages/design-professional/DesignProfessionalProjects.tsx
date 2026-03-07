import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export default function DesignProfessionalProjects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Projects</h1>
        <p className="text-muted-foreground">Projects you're currently working on</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No active projects yet</h3>
          <p className="text-muted-foreground">When you're assigned to a project, it will appear here with status tracking, files, and collaboration tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}
