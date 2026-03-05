import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Image,
  Upload,
  X,
  Loader2,
  Save,
  Eye,
  Calendar,
} from "lucide-react";

interface ScopePackageBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  trade: string;
  projectId: string;
  existingScope?: {
    scope_description?: string;
    scope_photos?: any[];
    blueprints?: any[];
    scope_documents?: any[];
    notes_for_subs?: string;
    project_address?: string;
    due_date?: string;
  };
  onSaved?: () => void;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export function ScopePackageBuilder({
  open,
  onOpenChange,
  packageId,
  trade,
  projectId,
  existingScope,
  onSaved,
}: ScopePackageBuilderProps) {
  const queryClient = useQueryClient();
  const [scopeDescription, setScopeDescription] = useState(
    existingScope?.scope_description || ""
  );
  const [notesForSubs, setNotesForSubs] = useState(
    existingScope?.notes_for_subs || ""
  );
  const [projectAddress, setProjectAddress] = useState(
    existingScope?.project_address || ""
  );
  const [dueDate, setDueDate] = useState(existingScope?.due_date || "");
  const [photos, setPhotos] = useState<UploadedFile[]>(
    existingScope?.scope_photos || []
  );
  const [blueprints, setBlueprints] = useState<UploadedFile[]>(
    existingScope?.blueprints || []
  );
  const [documents, setDocuments] = useState<UploadedFile[]>(
    existingScope?.scope_documents || []
  );
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, folder: string): Promise<UploadedFile> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${projectId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    return {
      name: file.name,
      url: urlData.publicUrl,
      type: file.type,
      size: file.size,
    };
  };

  const onDropPhotos = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        acceptedFiles.map((file) => uploadFile(file, "scope-photos"))
      );
      setPhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${acceptedFiles.length} photo(s) uploaded`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const onDropBlueprints = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        acceptedFiles.map((file) => uploadFile(file, "blueprints"))
      );
      setBlueprints((prev) => [...prev, ...uploaded]);
      toast.success(`${acceptedFiles.length} blueprint(s) uploaded`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload blueprints");
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const onDropDocuments = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        acceptedFiles.map((file) => uploadFile(file, "scope-documents"))
      );
      setDocuments((prev) => [...prev, ...uploaded]);
      toast.success(`${acceptedFiles.length} document(s) uploaded`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const {
    getRootProps: getPhotosRootProps,
    getInputProps: getPhotosInputProps,
  } = useDropzone({
    onDrop: onDropPhotos,
    accept: { "image/*": [] },
    disabled: uploading,
  });

  const {
    getRootProps: getBlueprintsRootProps,
    getInputProps: getBlueprintsInputProps,
  } = useDropzone({
    onDrop: onDropBlueprints,
    accept: { "application/pdf": [], "image/*": [] },
    disabled: uploading,
  });

  const {
    getRootProps: getDocumentsRootProps,
    getInputProps: getDocumentsInputProps,
  } = useDropzone({
    onDrop: onDropDocuments,
    disabled: uploading,
  });

  const removeFile = (
    type: "photos" | "blueprints" | "documents",
    index: number
  ) => {
    if (type === "photos") {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "blueprints") {
      setBlueprints((prev) => prev.filter((_, i) => i !== index));
    } else {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("sub_bid_packages")
        .update({
          scope_description: scopeDescription,
          scope_photos: photos as any,
          blueprints: blueprints as any,
          scope_documents: documents as any,
          notes_for_subs: notesForSubs,
          project_address: projectAddress,
          due_date: dueDate || null,
        })
        .eq("id", packageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-packages"] });
      toast.success("Scope package saved");
      onSaved?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save scope package");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scope Package Builder - {trade}
          </DialogTitle>
          <DialogDescription>
            Build the scope package that subcontractors will see when bidding
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectAddress">Project Address</Label>
                <Input
                  id="projectAddress"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bid Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Scope Description */}
            <div className="space-y-2">
              <Label htmlFor="scopeDescription">Scope Description</Label>
              <Textarea
                id="scopeDescription"
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                placeholder="Describe the scope of work for this trade..."
                rows={6}
              />
            </div>

            {/* File Uploads */}
            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="photos" className="gap-2">
                  <Image className="h-4 w-4" />
                  Photos ({photos.length})
                </TabsTrigger>
                <TabsTrigger value="blueprints" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Blueprints ({blueprints.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Documents ({documents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="space-y-3">
                <div
                  {...getPhotosRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <input {...getPhotosInputProps()} />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag photos here or click to upload
                  </p>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeFile("photos", i)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="blueprints" className="space-y-3">
                <div
                  {...getBlueprintsRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <input {...getBlueprintsInputProps()} />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag blueprints (PDF/images) here or click to upload
                  </p>
                </div>
                {blueprints.length > 0 && (
                  <div className="space-y-2">
                    {blueprints.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile("blueprints", i)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-3">
                <div
                  {...getDocumentsRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <input {...getDocumentsInputProps()} />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag documents here or click to upload
                  </p>
                </div>
                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile("documents", i)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Notes for Subs */}
            <div className="space-y-2">
              <Label htmlFor="notesForSubs">Notes for Subcontractors</Label>
              <Textarea
                id="notesForSubs"
                value={notesForSubs}
                onChange={(e) => setNotesForSubs(e.target.value)}
                placeholder="Any special instructions or notes for subcontractors..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || uploading}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Scope Package
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
