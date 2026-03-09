import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const STAGES = [
  { key: "new_lead", label: "New Projects", color: "bg-blue-500" },
  { key: "walkthrough_scheduled", label: "Walkthrough Scheduled", color: "bg-amber-500" },
  { key: "estimate_in_progress", label: "Scope In Progress", color: "bg-purple-500" },
  { key: "estimate_sent", label: "Bid Packets Sent", color: "bg-indigo-500" },
  { key: "qualified", label: "Bids Received", color: "bg-emerald-500" },
  { key: "contractor_selected", label: "Contractor Selected", color: "bg-green-600" },
  { key: "completed", label: "Completed", color: "bg-muted-foreground" },
];

export default function AdminProjectPipeline() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-pipeline-leads", stageFilter],
    queryFn: async () => {
      let q = supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (stageFilter !== "all") q = q.eq("status", stageFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Stage counts
  const { data: stageCounts } = useQuery({
    queryKey: ["admin-pipeline-counts"],
    queryFn: async () => {
      const results = await Promise.all(
        STAGES.map(s =>
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", s.key)
        )
      );
      return STAGES.reduce((acc, s, i) => {
        acc[s.key] = results[i].count ?? 0;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  const filtered = leads?.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.project_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Pipeline</h1>
          <p className="text-muted-foreground">Full project lifecycle from intake to completion</p>
        </div>

        {/* Conversion Funnel */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {STAGES.map((stage, i) => {
                const count = stageCounts?.[stage.key] ?? 0;
                const maxCount = Math.max(...Object.values(stageCounts || { _: 1 }), 1);
                const widthPct = Math.max(20, (count / maxCount) * 100);
                return (
                  <div key={stage.key} className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setStageFilter(stage.key === stageFilter ? "all" : stage.key)}
                      className={`relative rounded-md p-3 text-center transition-all hover:ring-2 hover:ring-primary/50 ${
                        stageFilter === stage.key ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ width: `${widthPct}%`, minWidth: 100 }}
                    >
                      <div className={`absolute inset-0 rounded-md ${stage.color} opacity-10`} />
                      <p className="text-xl font-bold text-foreground relative">{count}</p>
                      <p className="text-[10px] text-muted-foreground relative leading-tight mt-1">{stage.label}</p>
                    </button>
                    {i < STAGES.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Stages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Project List */}
        <div className="grid gap-3">
          {isLoading ? (
            <Card className="border-border"><CardContent className="p-8 text-center text-muted-foreground">Loading pipeline...</CardContent></Card>
          ) : filtered?.length === 0 ? (
            <Card className="border-border"><CardContent className="p-8 text-center text-muted-foreground">No projects found</CardContent></Card>
          ) : (
            filtered?.map((lead) => {
              const stage = STAGES.find(s => s.key === lead.status);
              return (
                <Link key={lead.id} to={`/admin/intake/${lead.id}`}>
                  <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${stage?.color || "bg-muted"}`} />
                        <div>
                          <p className="font-medium text-foreground">{lead.name || "Unnamed Project"}</p>
                          <p className="text-sm text-muted-foreground">{lead.project_type} • {lead.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lead.estimated_budget && (
                          <span className="text-sm font-mono text-foreground">${Number(lead.estimated_budget).toLocaleString()}</span>
                        )}
                        <Badge variant="outline">{stage?.label || lead.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {lead.updated_at ? format(new Date(lead.updated_at), "MMM d") : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
