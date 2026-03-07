import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ClipboardList, FileText, Calculator, ArrowRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function AdminEstimatingHub() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Leads in estimating stages
  const { data: estimatingLeads, isLoading } = useQuery({
    queryKey: ["admin-estimating-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("status", ["walkthrough_scheduled", "estimate_in_progress", "estimate_sent", "scope_review"])
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Cost codes summary
  const { data: costCodeStats } = useQuery({
    queryKey: ["admin-cost-code-stats"],
    queryFn: async () => {
      const { count } = await supabase.from("cost_codes").select("id", { count: "exact", head: true });
      return { totalCodes: count ?? 0 };
    },
  });

  const filtered = estimatingLeads?.filter((l) =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.project_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estimating Hub</h1>
          <p className="text-muted-foreground">Manage field mode, bid packets, and cost code libraries</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Walkthroughs Scheduled", value: estimatingLeads?.filter(l => l.status === "walkthrough_scheduled").length ?? 0, icon: ClipboardList },
            { label: "Estimates In Progress", value: estimatingLeads?.filter(l => l.status === "estimate_in_progress").length ?? 0, icon: FileText },
            { label: "Estimates Sent", value: estimatingLeads?.filter(l => l.status === "estimate_sent").length ?? 0, icon: ArrowRight },
            { label: "Cost Codes", value: costCodeStats?.totalCodes ?? 0, icon: Calculator },
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">All Estimates</TabsTrigger>
            <TabsTrigger value="field-mode">Field Mode</TabsTrigger>
            <TabsTrigger value="bid-packets">Bid Packets</TabsTrigger>
            <TabsTrigger value="cost-codes">Cost Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search estimates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Homeowner</TableHead>
                      <TableHead>Project Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filtered?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No estimates found</TableCell></TableRow>
                    ) : (
                      filtered?.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                          <TableCell>{lead.project_type || "—"}</TableCell>
                          <TableCell>{lead.location || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.status?.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell>{lead.estimated_budget ? `$${Number(lead.estimated_budget).toLocaleString()}` : "—"}</TableCell>
                          <TableCell>{lead.updated_at ? format(new Date(lead.updated_at), "MMM d") : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link to={`/admin/estimating/${lead.id}/field-mode`}>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                  <Eye className="h-3.5 w-3.5" /> Field Mode
                                </Button>
                              </Link>
                              <Link to={`/admin/estimating/${lead.id}/bid-packet`}>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                  <FileText className="h-3.5 w-3.5" /> Bid Packet
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="field-mode">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Field Mode Workspaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Field mode workspaces for on-site measurements, photos, and notes.</p>
                   {estimatingLeads?.filter(l => l.status === "walkthrough_scheduled").map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.project_type} • {lead.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Walkthrough Scheduled</Badge>
                        <Link to={`/admin/estimating/${lead.id}/field-mode`}>
                          <Button size="sm">Open Field Mode</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {!estimatingLeads?.some(l => l.status === "walkthrough_scheduled") && (
                    <p className="text-center text-muted-foreground py-8">No active field mode workspaces</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bid-packets">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Bid Packet Workspaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Convert field data into contractor-facing bid packages.</p>
                   {estimatingLeads?.filter(l => l.status === "estimate_in_progress" || l.status === "estimate_sent").map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.project_type} • {lead.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lead.status === "estimate_sent" ? "default" : "outline"}>
                          {lead.status?.replace(/_/g, " ")}
                        </Badge>
                        <Link to={`/admin/estimating/${lead.id}/bid-packet`}>
                          <Button size="sm">Open Bid Packet</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {!estimatingLeads?.some(l => ["estimate_in_progress", "estimate_sent"].includes(l.status || "")) && (
                    <p className="text-center text-muted-foreground py-8">No active bid packet workspaces</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cost-codes">
            <AdminCostCodeLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function AdminCostCodeLibrary() {
  const [search, setSearch] = useState("");
  
  const { data: costCodes, isLoading } = useQuery({
    queryKey: ["admin-cost-codes", search],
    queryFn: async () => {
      let q = supabase
        .from("cost_codes")
        .select("*, contractors(name)")
        .order("code", { ascending: true })
        .limit(100);
      
      if (search) {
        q = q.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search cost codes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Labor Rate</TableHead>
                <TableHead>Material Rate</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Contractor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : costCodes?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No cost codes found</TableCell></TableRow>
              ) : (
                costCodes?.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-mono text-sm">{cc.code}</TableCell>
                    <TableCell>{cc.description}</TableCell>
                    <TableCell>{cc.unit}</TableCell>
                    <TableCell className="font-mono">${cc.labor_rate.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${cc.material_rate.toFixed(2)}</TableCell>
                    <TableCell className="font-mono font-medium">${cc.total_unit_price.toFixed(2)}</TableCell>
                    <TableCell>{(cc.contractors as any)?.name || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
