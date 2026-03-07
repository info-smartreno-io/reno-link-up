import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Image, FolderOpen, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type FileCategory = "all" | "blueprints" | "photos" | "daily_logs";

export default function AdminFileStorage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FileCategory>("all");

  // Blueprint files
  const { data: blueprints, isLoading: bpLoading } = useQuery({
    queryKey: ["admin-blueprints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blueprint_files")
        .select("*, architect_projects(project_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Walkthrough photos
  const { data: photos, isLoading: phLoading } = useQuery({
    queryKey: ["admin-walkthrough-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("walkthrough_photos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = bpLoading || phLoading;

  // Unified file list
  const allFiles = [
    ...(blueprints?.map(b => ({
      id: b.id,
      name: b.file_name,
      type: "Blueprint" as const,
      category: "blueprints" as const,
      size: b.file_size,
      project: (b.architect_projects as any)?.project_name || "—",
      uploadedBy: b.uploaded_by,
      createdAt: b.created_at,
      version: b.version,
    })) ?? []),
    ...(photos?.map(p => ({
      id: p.id,
      name: p.file_name,
      type: "Photo" as const,
      category: "photos" as const,
      size: 0,
      project: "—",
      uploadedBy: p.user_id,
      createdAt: p.created_at,
      version: null,
    })) ?? []),
  ];

  const filtered = allFiles
    .filter(f => category === "all" || f.category === category)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.project.toLowerCase().includes(search.toLowerCase()));

  function formatSize(bytes: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">File Storage Center</h1>
          <p className="text-muted-foreground">Centralized project file management</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Files", value: allFiles.length, icon: FolderOpen },
            { label: "Blueprints", value: blueprints?.length ?? 0, icon: FileText },
            { label: "Photos", value: photos?.length ?? 0, icon: Image },
            { label: "Categories", value: 3, icon: FolderOpen },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                    <Icon className="h-6 w-6 text-muted-foreground opacity-50" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="blueprints">Blueprints</SelectItem>
              <SelectItem value="photos">Photos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No files found</TableCell></TableRow>
                ) : (
                  filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {f.type === "Blueprint" ? <FileText className="h-4 w-4 text-blue-500" /> : <Image className="h-4 w-4 text-green-500" />}
                        <span className="truncate max-w-[250px]">{f.name}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
                      <TableCell>{f.project}</TableCell>
                      <TableCell>{formatSize(f.size)}</TableCell>
                      <TableCell>{f.version ?? "—"}</TableCell>
                      <TableCell>{format(new Date(f.createdAt), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
