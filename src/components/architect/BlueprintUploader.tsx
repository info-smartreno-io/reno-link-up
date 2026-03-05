import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, X, Download, Eye, History, Plus, GitCompare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BlueprintCompare } from "./BlueprintCompare";

interface BlueprintFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  version: number;
  parent_blueprint_id: string | null;
  is_latest: boolean;
  version_notes: string | null;
  created_at: string;
}

interface BlueprintFamily {
  familyId: string;
  baseName: string;
  latestVersion: BlueprintFile;
  versions: BlueprintFile[];
}

interface BlueprintUploaderProps {
  projectId: string;
  projectName: string;
}

export function BlueprintUploader({ projectId, projectName }: BlueprintUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [blueprints, setBlueprints] = useState<BlueprintFile[]>([]);
  const [blueprintFamilies, setBlueprintFamilies] = useState<BlueprintFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<BlueprintFile | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [uploadMode, setUploadMode] = useState<'new' | 'version'>('new');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<BlueprintFile | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<BlueprintFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load existing blueprints
  useEffect(() => {
    const loadBlueprints = async () => {
      try {
        const { data, error } = await supabase
          .from('blueprint_files')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const blueprintData = data || [];
        setBlueprints(blueprintData);
        
        // Group blueprints into families
        const families = groupBlueprintsByFamily(blueprintData);
        setBlueprintFamilies(families);
      } catch (error) {
        console.error('Error loading blueprints:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlueprints();
  }, [projectId]);

  const groupBlueprintsByFamily = (blueprints: BlueprintFile[]): BlueprintFamily[] => {
    const familyMap = new Map<string, BlueprintFile[]>();
    
    // Group by family ID (parent_blueprint_id or id if it's the root)
    blueprints.forEach(bp => {
      const familyId = bp.parent_blueprint_id || bp.id;
      if (!familyMap.has(familyId)) {
        familyMap.set(familyId, []);
      }
      familyMap.get(familyId)!.push(bp);
    });
    
    // Convert to family objects
    const families: BlueprintFamily[] = [];
    familyMap.forEach((versions, familyId) => {
      const sortedVersions = versions.sort((a, b) => b.version - a.version);
      const latestVersion = sortedVersions[0];
      
      families.push({
        familyId,
        baseName: latestVersion.file_name.replace(/\s*v\d+\.\d+/, ''), // Remove version suffix
        latestVersion,
        versions: sortedVersions,
      });
    });
    
    return families.sort((a, b) => 
      new Date(b.latestVersion.created_at).getTime() - new Date(a.latestVersion.created_at).getTime()
    );
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Blueprint files must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine version number
      let version = 1;
      let parentId = null;
      
      if (uploadMode === 'version' && selectedParent) {
        // Find the highest version number in this family
        const parentBlueprint = blueprints.find(b => b.id === selectedParent);
        const familyId = parentBlueprint?.parent_blueprint_id || selectedParent;
        const familyBlueprints = blueprints.filter(
          b => b.id === familyId || b.parent_blueprint_id === familyId
        );
        version = Math.max(...familyBlueprints.map(b => b.version)) + 1;
        parentId = selectedParent;
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data: blueprintData, error: dbError } = await supabase
        .from('blueprint_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          description: description || null,
          version: version,
          parent_blueprint_id: parentId,
          version_notes: versionNotes || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Reload blueprints to update the list
      const { data: updatedBlueprints } = await supabase
        .from('blueprint_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      const blueprintData2 = updatedBlueprints || [];
      setBlueprints(blueprintData2);
      setBlueprintFamilies(groupBlueprintsByFamily(blueprintData2));
      
      setDescription("");
      setVersionNotes("");
      setUploadMode('new');
      setSelectedParent(null);
      
      toast({
        title: "Success",
        description: `Blueprint ${uploadMode === 'version' ? `v${version}` : ''} uploaded successfully`,
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading blueprint:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload blueprint",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (blueprint: BlueprintFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('blueprints')
        .remove([blueprint.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('blueprint_files')
        .delete()
        .eq('id', blueprint.id);

      if (dbError) throw dbError;

      setBlueprints(blueprints.filter(b => b.id !== blueprint.id));
      
      // Reload and regroup
      const updatedBlueprints = blueprints.filter(b => b.id !== blueprint.id);
      setBlueprints(updatedBlueprints);
      setBlueprintFamilies(groupBlueprintsByFamily(updatedBlueprints));
      
      toast({
        title: "Success",
        description: "Blueprint deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete blueprint",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (blueprint: BlueprintFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('blueprints')
        .download(blueprint.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = blueprint.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Blueprint downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading blueprint:', error);
      toast({
        title: "Download failed",
        description: "Failed to download blueprint",
        variant: "destructive",
      });
    }
  };

  const handleView = async (blueprint: BlueprintFile) => {
    setSelectedFile(blueprint);
    setViewerOpen(true);
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('blueprints')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleCompare = (family: BlueprintFamily) => {
    if (family.versions.length < 2) return;
    
    // Default to latest vs previous version
    setCompareVersion1(family.versions[0]);
    setCompareVersion2(family.versions[1]);
    setCompareOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blueprint Files</CardTitle>
        <CardDescription>
          Upload and manage blueprint files for {projectName} (max 100MB per file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Mode Selection */}
        <div className="flex gap-2 p-2 bg-muted rounded-lg">
          <Button
            variant={uploadMode === 'new' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setUploadMode('new');
              setSelectedParent(null);
            }}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Blueprint
          </Button>
          <Button
            variant={uploadMode === 'version' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setUploadMode('version')}
            className="flex-1"
            disabled={blueprintFamilies.length === 0}
          >
            <History className="h-4 w-4 mr-2" />
            New Version
          </Button>
        </div>

        {uploadMode === 'version' && (
          <div>
            <Label htmlFor="parent-select">Select Blueprint to Version</Label>
            <select
              id="parent-select"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={selectedParent || ''}
              onChange={(e) => setSelectedParent(e.target.value)}
            >
              <option value="">Select a blueprint...</option>
              {blueprintFamilies.map((family) => (
                <option key={family.familyId} value={family.latestVersion.id}>
                  {family.baseName} (current: v{family.latestVersion.version})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this blueprint..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="blueprint-upload">Upload Blueprint</Label>
            <div className="flex gap-2">
              <Input
                id="blueprint-upload"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.tiff,.tif,.dwg,.dxf,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading}
                className="flex-1"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading || (uploadMode === 'version' && !selectedParent)}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: JPG, PNG, PDF, TIFF, DWG, DXF, Excel (max 100MB)
            </p>
          </div>
        </div>
          
          {uploadMode === 'version' && (
            <div>
              <Label htmlFor="version-notes">Version Notes</Label>
              <Textarea
                id="version-notes"
                placeholder="What changed in this version?"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                disabled={uploading || (uploadMode === 'version' && !selectedParent)}
                rows={2}
              />
            </div>
          )}
          
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blueprints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No blueprints uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blueprintFamilies.map((family) => (
              <Collapsible key={family.familyId}>
                <div className="border rounded-lg">
                  {/* Latest Version - Always Visible */}
                  <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{family.latestVersion.file_name}</p>
                        <Badge variant="default" className="text-xs">
                          v{family.latestVersion.version}
                        </Badge>
                        {family.versions.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {family.versions.length} versions
                          </Badge>
                        )}
                      </div>
                      {family.latestVersion.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {family.latestVersion.description}
                        </p>
                      )}
                      {family.latestVersion.version_notes && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          {family.latestVersion.version_notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(family.latestVersion.file_size)} • {new Date(family.latestVersion.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {family.versions.length > 1 && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCompare(family)}
                            title="Compare versions"
                          >
                            <GitCompare className="h-4 w-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <History className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                        </>
                      )}
                      {(family.latestVersion.file_type.startsWith('image/') || 
                        family.latestVersion.file_type === 'application/pdf') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(family.latestVersion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(family.latestVersion)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(family.latestVersion)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Version History - Collapsible */}
                  {family.versions.length > 1 && (
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30">
                        <div className="p-3 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Previous Versions</p>
                          {family.versions.slice(1).map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-2 bg-background rounded border"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    v{version.version}
                                  </Badge>
                                  <p className="text-sm truncate">{version.file_name}</p>
                                </div>
                                {version.version_notes && (
                                  <p className="text-xs text-muted-foreground italic truncate">
                                    {version.version_notes}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(version.file_size)} • {new Date(version.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                {(version.file_type.startsWith('image/') || 
                                  version.file_type === 'application/pdf') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleView(version)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownload(version)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(version)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>

      {/* File Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedFile?.file_name}</span>
              {selectedFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-auto max-h-[70vh]">
            {selectedFile?.file_type === 'application/pdf' ? (
              <iframe
                src={getFileUrl(selectedFile.file_path)}
                className="w-full h-[70vh] rounded-lg border"
                title="PDF Viewer"
              />
            ) : selectedFile?.file_type.startsWith('image/') ? (
              <img
                src={getFileUrl(selectedFile.file_path)}
                alt={selectedFile.file_name}
                className="w-full h-auto rounded-lg"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Blueprint Comparison Dialog */}
      {compareVersion1 && compareVersion2 && (
        <BlueprintCompare
          open={compareOpen}
          onOpenChange={setCompareOpen}
          version1={compareVersion1}
          version2={compareVersion2}
        />
      )}
    </Card>
  );
}
