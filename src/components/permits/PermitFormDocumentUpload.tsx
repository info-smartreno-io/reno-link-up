import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface PermitFormDocumentUploadProps {
  permitRequiredFormId: string;
  currentDocumentPath?: string;
  onUploadComplete: (filePath: string) => void;
}

export function PermitFormDocumentUpload({
  permitRequiredFormId,
  currentDocumentPath,
  onUploadComplete,
}: PermitFormDocumentUploadProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF preferred for permits)
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or image file");
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${permitRequiredFormId}-${Date.now()}.${fileExt}`;
      const filePath = `permits/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update permit_required_forms with the file path
      const { error: updateError } = await supabase
        .from('permit_required_forms' as any)
        .update({ 
          document_file_path: filePath,
          status: 'uploaded',
          updated_at: new Date().toISOString()
        })
        .eq('id', permitRequiredFormId);

      if (updateError) throw updateError;

      toast.success("Document uploaded successfully");
      onUploadComplete(filePath);
      setShowDialog(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentDocumentPath) return;

    try {
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .download(currentDocumentPath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentDocumentPath.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document downloaded");
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error("Failed to download document");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {currentDocumentPath && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentDocumentPath ? 'Replace' : 'Upload'}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Permit Document</DialogTitle>
            <DialogDescription>
              Upload a completed, signed, or stamped permit form (PDF or image)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document">Select Document</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
