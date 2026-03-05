import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void;
  currentFile?: File | null;
  currentPreview?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
}

export function ReceiptUpload({
  onFileSelect,
  currentFile,
  currentPreview,
  onRemove,
  disabled = false,
}: ReceiptUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPreview || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileSelect(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (currentFile || preview) {
    return (
      <div className="relative border-2 border-dashed border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          {preview ? (
            <img 
              src={preview} 
              alt="Receipt preview" 
              className="h-16 w-16 object-cover rounded-lg"
            />
          ) : (
            <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentFile?.name || "Receipt uploaded"}
            </p>
            {currentFile && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentFile.size)}
              </p>
            )}
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-muted rounded-full">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div>
          <p className="text-sm font-medium">
            {isDragActive ? "Drop receipt here" : "Upload receipt"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click to browse
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            disabled={disabled}
          >
            <Image className="h-4 w-4 mr-2" />
            Browse
          </Button>
          
          {/* Mobile camera capture */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="md:hidden"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) onDrop([file]);
              };
              input.click();
            }}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          JPG, PNG, PDF up to 10MB
        </p>
      </div>
    </div>
  );
}