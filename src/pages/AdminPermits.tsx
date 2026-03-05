import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Search, AlertTriangle, ExternalLink } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { PermitStatusBadge } from "@/components/permits/PermitStatusBadge";
import { MunicipalityFeeSchedules } from "@/components/permits/MunicipalityFeeSchedules";
import { PermitAdvisorPanel } from "@/components/admin/PermitAdvisorPanel";

export default function AdminPermits() {
  const [loading, setLoading] = useState(true);
  const [permits, setPermits] = useState<any[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [municipalityFilter, setMunicipalityFilter] = useState("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  useEffect(() => {
    fetchPermits();
  }, []);

  useEffect(() => {
    filterPermits();
  }, [permits, searchQuery, statusFilter, municipalityFilter, showOverdueOnly]);

  const fetchPermits = async () => {
    try {
      const { data, error } = await supabase
        .from("permits" as any)
        .select("*, projects!inner(homeowner_name, address), permit_required_forms(id, status)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processed = data?.map((p: any) => ({
        ...p,
        completionPercentage: p.permit_required_forms?.length > 0 
          ? Math.round((p.permit_required_forms.filter((f: any) => f.status === "uploaded" || f.status === "approved").length / p.permit_required_forms.length) * 100)
          : 0
      })) || [];

      setPermits(processed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load permits");
    } finally {
      setLoading(false);
    }
  };

  const filterPermits = () => {
    let filtered = [...permits];
    if (searchQuery) filtered = filtered.filter(p => p.projects?.homeowner_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.jurisdiction_municipality?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.status === statusFilter);
    if (municipalityFilter !== "all") filtered = filtered.filter(p => p.jurisdiction_municipality === municipalityFilter);
    if (showOverdueOnly) filtered = filtered.filter(p => p.estimated_approval_date && new Date(p.estimated_approval_date) < new Date() && !['approved', 'closed'].includes(p.status));
    setFilteredPermits(filtered);
  };

  const municipalities = Array.from(new Set(permits.map(p => p.jurisdiction_municipality).filter(Boolean))).sort();
  const overdueCount = permits.filter(p => p.estimated_approval_date && new Date(p.estimated_approval_date) < new Date() && !['approved', 'closed'].includes(p.status)).length;

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permit Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage all active permits</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Active Permits</CardTitle>
            <CardDescription>{filteredPermits.length} of {permits.length} permits {overdueCount > 0 && <span className="ml-2 text-destructive">• {overdueCount} Overdue</span>}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant={showOverdueOnly ? "default" : "outline"} onClick={() => setShowOverdueOnly(!showOverdueOnly)}>
                <AlertTriangle className="h-4 w-4 mr-2" />{showOverdueOnly ? "Showing Overdue" : "Show Overdue"}
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Municipality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Forms</TableHead>
                    <TableHead>Est. Approval</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermits.map(p => {
                    const isOverdue = p.estimated_approval_date && new Date(p.estimated_approval_date) < new Date() && !['approved', 'closed'].includes(p.status);
                    return (
                      <TableRow key={p.id} className={isOverdue ? "bg-destructive/5" : ""}>
                        <TableCell><div className="font-medium">{p.projects?.homeowner_name}</div><div className="text-sm text-muted-foreground">{p.projects?.address}</div></TableCell>
                        <TableCell>{p.jurisdiction_municipality}</TableCell>
                        <TableCell><PermitStatusBadge status={p.status} /></TableCell>
                        <TableCell><Progress value={p.completionPercentage} className="h-1.5" /></TableCell>
                        <TableCell>{p.estimated_approval_date ? format(new Date(p.estimated_approval_date), "MMM d") : "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => window.location.href = `/admin/project-assignments?project=${p.project_id}`}><ExternalLink className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* AI Permit Advisor Section */}
        <PermitAdvisorPanel />

        {/* Municipality Fee Schedules Section */}
        <MunicipalityFeeSchedules />
      </div>
    </AdminLayout>
  );
}
