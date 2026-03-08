import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadHomeDocument, DOCUMENT_TYPES } from "@/hooks/useHomeProfile";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";

interface Props {
  profileId: string;
  onClose: () => void;
}

export function UploadDocumentModal({ profileId, onClose }: Props) {
  const upload = useUploadHomeDocument();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("other");

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    await upload.mutateAsync({ file, profileId, documentType });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center gap-2 justify-center">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop a file here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG</p>
              </div>
            )}
          </div>
          <div>
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
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
