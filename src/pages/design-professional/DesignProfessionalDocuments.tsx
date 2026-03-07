import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function DesignProfessionalDocuments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Plans, renderings, selections, and shared resources</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-muted-foreground">Project documents and shared files will appear here when you're assigned to active projects.</p>
        </CardContent>
      </Card>
    </div>
  );
}
