import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadFieldProps {
  label: string;
  bucket: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
}

export function FileUploadField({ label, bucket, currentUrl, onUpload, onRemove, accept = ".pdf,.jpg,.jpeg,.png" }: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      onUpload(publicUrl);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {currentUrl ? (
        <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate hover:underline flex-1">
            View uploaded file
          </a>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Input
            type="file"
            accept={accept}
            onChange={handleUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
