import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Loader2, Package, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BulkPermitGeneratorProps {
  permitId: string;
  formsCount: number;
  onGenerationComplete?: () => void;
}

export function BulkPermitGenerator({
  permitId,
  formsCount,
  onGenerationComplete
}: BulkPermitGeneratorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setProgress(10);

      console.log("Generating permit package for:", permitId);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-permit-package', {
        body: { permitId }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error("Error generating package:", error);
        throw error;
      }

      console.log("Package generated:", data);

      setProgress(100);
      setDownloadUrl(data.downloadUrl);
      setFileName(data.fileName);

      toast.success(`Permit package generated with ${data.formCount} forms!`);
      
      if (onGenerationComplete) {
        onGenerationComplete();
      }
    } catch (error: any) {
      console.error("Error generating permit package:", error);
      toast.error(error.message || "Failed to generate permit package");
      setShowDialog(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.success("Download started");
    }
  };

  const handleReset = () => {
    setShowDialog(false);
    setProgress(0);
    setDownloadUrl(null);
    setFileName("");
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={formsCount === 0}
        className="w-full"
      >
        <Package className="h-4 w-4 mr-2" />
        Generate Complete Permit Package ({formsCount} forms)
      </Button>

      <Dialog open={showDialog} onOpenChange={!generating ? setShowDialog : undefined}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bulk Permit Form Generation
            </DialogTitle>
            <DialogDescription>
              {!downloadUrl ? (
                <>
                  Generate a complete permit package with all {formsCount} required forms 
                  auto-filled with your project data.
                </>
              ) : (
                "Your permit package is ready to download!"
              )}
            </DialogDescription>
          </DialogHeader>

          {!downloadUrl ? (
            <>
              {generating && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Generating forms...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {progress < 30 && "Fetching project data..."}
                      {progress >= 30 && progress < 60 && "Generating UCC forms..."}
                      {progress >= 60 && progress < 90 && "Creating PDF package..."}
                      {progress >= 90 && "Finalizing document..."}
                    </span>
                  </div>
                </div>
              )}

              {!generating && (
                <div className="py-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">What's included:</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                          <li>• Cover page with project summary</li>
                          <li>• All {formsCount} required UCC forms</li>
                          <li>• Auto-filled with project data</li>
                          <li>• Submission checklist</li>
                          <li>• Ready to print and submit</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <p className="font-semibold">Package Generated Successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fileName}
                  </p>
                </div>

                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Permit Package PDF
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {!downloadUrl ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Generate Package
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
