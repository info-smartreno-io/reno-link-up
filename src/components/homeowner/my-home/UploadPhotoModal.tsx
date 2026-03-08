import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadHomePhoto, PHOTO_CATEGORIES } from "@/hooks/useHomeProfile";
import { useDropzone } from "react-dropzone";
import { Upload, Image } from "lucide-react";

interface Props {
  profileId: string;
  onClose: () => void;
}

export function UploadPhotoModal({ profileId, onClose }: Props) {
  const upload = useUploadHomePhoto();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("other");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setFile(files[0]);
      setPreview(URL.createObjectURL(files[0]));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    await upload.mutateAsync({ file, profileId, category, caption: caption || undefined });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Upload Home Photo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
            ) : (
              <div className="space-y-2">
                <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop a photo here or click to browse</p>
              </div>
            )}
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PHOTO_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Front of house from street" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!file || upload.isPending}>
              <Upload className="h-4 w-4 mr-1" /> {upload.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
