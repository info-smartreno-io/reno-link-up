import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/contractor/StatusBadge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FolderOpen } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function ContractorProjectsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["contractor-projects-list", search],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("contractor_projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`project_name.ilike.%${search}%,location.ilike.%${search}%,client_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <ContractorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Your awarded and active projects.</p>
        </header>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !projects?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No projects found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/contractor/projects/${project.id}/overview`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{project.project_name}</h3>
                      <StatusBadge value={project.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.location} · {project.client_name}
                      {project.estimated_value && ` · $${Number(project.estimated_value).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    {project.deadline
                      ? format(new Date(project.deadline), "MMM d, yyyy")
                      : "No deadline"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ContractorLayout>
  );
}
