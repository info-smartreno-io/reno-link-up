import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Image,
  File,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";

const FILE_CATEGORIES = [
  { key: "all", label: "All Files" },
  { key: "plans", label: "Plans & Renderings" },
  { key: "proposals", label: "Proposals" },
  { key: "photos", label: "Photos" },
  { key: "agreements", label: "Agreements" },
  { key: "other", label: "Other" },
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("pdf")) return FileText;
  return File;
}

function categorizeFile(fileName: string, fileType: string): string {
  const name = fileName.toLowerCase();
  if (fileType.startsWith("image/") || name.match(/\.(jpg|jpeg|png|webp|heic)$/)) return "photos";
  if (name.includes("proposal") || name.includes("bid")) return "proposals";
  if (name.includes("plan") || name.includes("render") || name.includes("blueprint")) return "plans";
  if (name.includes("contract") || name.includes("agreement") || name.includes("warranty")) return "agreements";
  return "other";
}

export default function HomeownerProjectFiles() {
  const { projectId } = useParams();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: files, isLoading } = useQuery({
    queryKey: ["homeowner-files", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blueprint_files")
        .select("id, file_name, file_path, file_type, file_size, created_at, description, version")
        .eq("project_id", projectId!)
        .eq("is_latest", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((f) => ({
        ...f,
        category: categorizeFile(f.file_name, f.file_type),
      }));
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  const filtered = activeCategory === "all"
    ? files
    : files?.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Project Files</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Documents, plans, and photos for your project.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {FILE_CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.key ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {filtered?.length ? (
        <div className="space-y-2">
          {filtered.map((file) => {
            const Icon = getFileIcon(file.file_type);
            const sizeKB = Math.round((file.file_size || 0) / 1024);
            const sizeLabel = sizeKB > 1024
              ? `${(sizeKB / 1024).toFixed(1)} MB`
              : `${sizeKB} KB`;

            return (
              <Card key={file.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sizeLabel}</span>
                      <span>·</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      {file.version > 1 && (
                        <>
                          <span>·</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            v{file.version}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No files in this category.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
