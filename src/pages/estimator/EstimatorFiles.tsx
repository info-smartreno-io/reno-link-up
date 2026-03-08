import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";

export default function EstimatorFiles() {
  return (
    <EstimatorLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Files</h1>
          <p className="text-muted-foreground">Project documents, photos, and uploads</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No files yet</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Uploaded photos, documents, and project files will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </EstimatorLayout>
  );
}
