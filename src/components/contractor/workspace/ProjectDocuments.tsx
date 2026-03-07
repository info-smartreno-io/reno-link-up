import { useProjectDocuments } from "@/hooks/contractor/useProjectDocuments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, Trash2, Download, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ProjectDocumentsProps {
  projectId: string;
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const { data: documents, isLoading, uploadDocument, deleteDocument } = useProjectDocuments(projectId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => uploadDocument.mutate(file));
  }, [uploadDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from("contractor-documents").download(filePath);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop files here..." : "Drag & drop files, or click to browse"}
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !documents?.length ? (
        <p className="text-center text-muted-foreground py-8">No documents uploaded yet.</p>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Uploaded Files</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 py-3">
                  <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDocument.mutate({ id: doc.id, filePath: doc.file_path })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
