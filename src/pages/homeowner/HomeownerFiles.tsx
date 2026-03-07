import { useState, useEffect } from "react";
import { Folder, Upload, FileText, Download, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FolderType = "survey" | "contracts" | "warranty" | "materials" | "plans";

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedDate: string;
  folder: FolderType;
  filePath: string;
}

const folders = [
  { id: "survey", label: "Survey", icon: Folder, color: "text-blue-500" },
  { id: "contracts", label: "Contracts", icon: Folder, color: "text-green-500" },
  { id: "warranty", label: "Warranty", icon: Folder, color: "text-purple-500" },
  { id: "materials", label: "Material Selections", icon: Folder, color: "text-orange-500" },
  { id: "plans", label: "Architectural Plans / Designs", icon: Folder, color: "text-pink-500" },
] as const;

// Map document types from contractor_project_documents to folder types
const documentTypeToFolder: Record<string, FolderType> = {
  'survey': 'survey',
  'contract': 'contracts',
  'contracts': 'contracts',
  'warranty': 'warranty',
  'material': 'materials',
  'materials': 'materials',
  'material_selection': 'materials',
  'blueprint': 'plans',
  'blueprints': 'plans',
  'design': 'plans',
  'designs': 'plans',
  'plan': 'plans',
  'plans': 'plans',
  'architectural': 'plans',
  'permit': 'contracts',
  'invoice': 'contracts',
  'insurance': 'warranty',
  'proposal': 'contracts',
  'estimate': 'contracts',
  'change_order': 'contracts',
  'inspection': 'survey',
  'photo': 'materials',
  'other': 'contracts',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function HomeownerFiles() {
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState<FolderType>("survey");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      const userId = user.id;

      // Get homeowner's projects via homeowner_projects table
      const { data: homeownerProjects, error: projectsError } = await supabase
        .from('homeowner_projects')
        .select('project_id')
        .eq('homeowner_id', userId);

      if (projectsError) {
        console.error('Error fetching homeowner projects:', projectsError);
        setLoading(false);
        return;
      }

      if (!homeownerProjects?.length) {
        setLoading(false);
        return;
      }

      const projectIds = homeownerProjects.map(p => p.project_id);
      await fetchDocumentsForProjects(projectIds);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocumentsForProjects(projectIds: string[]) {
    // Get documents for those projects
    const { data: documents, error: docsError } = await supabase
      .from('contractor_project_documents')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return;
    }

    // Transform documents to FileItem format
    const fileItems: FileItem[] = (documents || []).map(doc => {
      const docType = (doc.document_type || 'other').toLowerCase();
      const folder = documentTypeToFolder[docType] || 'contracts';
      
      return {
        id: doc.id,
        name: doc.file_name || 'Unnamed Document',
        size: formatFileSize(doc.file_size || 0),
        uploadedDate: doc.created_at || new Date().toISOString(),
        folder: folder,
        filePath: doc.file_path || '',
      };
    });

    setFiles(fileItems);
  }

  async function handleDownload(file: FileItem) {
    if (!file.filePath) {
      toast.error('File path not available');
      return;
    }

    try {
      setDownloading(file.id);
      
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(file.filePath, 60); // 60 seconds expiry

      if (error) {
        // Try alternative bucket names
        const altBuckets = ['contractor-documents', 'documents', 'files'];
        for (const bucket of altBuckets) {
          const { data: altData, error: altError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(file.filePath, 60);
          
          if (!altError && altData?.signedUrl) {
            window.open(altData.signedUrl, '_blank');
            return;
          }
        }
        throw error;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  }

  const folderFiles = files.filter(file => file.folder === selectedFolder);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/homeowner/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </Button>
          <h1 className="text-3xl font-bold text-foreground">My Files</h1>
          <p className="text-muted-foreground mt-2">
            Access all your project documents organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Folders</CardTitle>
              <CardDescription>Select a category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {folders.map((folder) => {
                const Icon = folder.icon;
                const fileCount = files.filter(f => f.folder === folder.id).length;
                
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id as FolderType)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedFolder === folder.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={selectedFolder === folder.id ? "text-primary-foreground" : folder.color} />
                      <span className="text-sm font-medium">{folder.label}</span>
                    </div>
                    <Badge variant={selectedFolder === folder.id ? "secondary" : "outline"}>
                      {fileCount}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Files Area */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {folders.find(f => f.id === selectedFolder)?.label}
                  </CardTitle>
                  <CardDescription>
                    {folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {folderFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No files in this folder yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Files will appear here when your contractor uploads them
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {folderFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.size} • Uploaded {new Date(file.uploadedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(file)}
                          disabled={downloading === file.id}
                        >
                          {downloading === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
