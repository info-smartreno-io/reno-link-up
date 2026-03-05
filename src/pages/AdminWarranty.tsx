import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

type WarrantyClaim = {
  id: string;
  claim_number: string;
  claim_status: string;
  priority: string;
  reported_issue_title: string;
  reported_area: string;
  date_reported: string;
  next_action: string | null;
  next_action_due_at: string | null;
  within_coverage: boolean;
  project_id: string;
};

const statusOptions = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_review", label: "In Review" },
  { value: "info_requested", label: "Info Requested" },
  { value: "scheduled_inspection", label: "Scheduled" },
  { value: "awaiting_contractor", label: "Awaiting Contractor" },
  { value: "in_repair", label: "In Repair" },
  { value: "resolved", label: "Resolved" },
  { value: "denied", label: "Denied" },
];

export default function AdminWarranty() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    open: 0,
    newLast7Days: 0,
    avgDaysToResolve: 0,
  });

  useEffect(() => {
    fetchClaims();
    fetchStats();
  }, [statusFilter, search]);

  async function fetchClaims() {
    try {
      setLoading(true);
      let query = supabase
        .from("warranty_claims" as any)
        .select(`
          *
        `)
        .order("date_reported", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("claim_status", statusFilter);
      }

      if (search.trim()) {
        query = query.or(`claim_number.ilike.%${search}%,reported_issue_title.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClaims((data || []) as any as WarrantyClaim[]);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading warranty claims",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      // Count open claims
      const { count: openCount } = await supabase
        .from("warranty_claims" as any)
        .select("*", { count: "exact", head: true })
        .not("claim_status", "in", "(resolved,denied,closed)");

      // Count new claims in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: newCount } = await supabase
        .from("warranty_claims" as any)
        .select("*", { count: "exact", head: true })
        .gte("date_reported", sevenDaysAgo.toISOString());

      // Calculate avg days to resolve
      const { data: resolvedClaims } = await supabase
        .from("warranty_claims" as any)
        .select("date_reported, resolved_at")
        .not("resolved_at", "is", null)
        .gte("resolved_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      let avgDays = 0;
      if (resolvedClaims && resolvedClaims.length > 0) {
        const totalDays = (resolvedClaims as any[]).reduce((sum, claim) => {
          const reported = new Date((claim as any).date_reported);
          const resolved = new Date((claim as any).resolved_at!);
          return sum + Math.floor((resolved.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDays = Math.round(totalDays / resolvedClaims.length);
      }

      setStats({
        open: openCount || 0,
        newLast7Days: newCount || 0,
        avgDaysToResolve: avgDays,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-8 h-8" />
              Warranty Claims
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage warranty issues across all SmartReno projects
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/warranty/new">+ New Claim</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Claims</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New (Last 7 Days)</p>
                  <p className="text-2xl font-bold">{stats.newLast7Days}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Days to Resolve</p>
                  <p className="text-2xl font-bold">{stats.avgDaysToResolve}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
          <div className="ml-auto">
            <Input
              placeholder="Search claims, projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : claims.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No claims found for this filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-3 pr-4">Claim #</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Priority</th>
                      <th className="py-3 pr-4">Project</th>
                      <th className="py-3 pr-4">Issue</th>
                      <th className="py-3 pr-4">Area</th>
                      <th className="py-3 pr-4">Coverage</th>
                      <th className="py-3 pr-4">Reported</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{claim.claim_number}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">
                            {claim.claim_status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={getPriorityVariant(claim.priority)}>
                            {claim.priority}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{claim.claim_number}</div>
                        </td>
                        <td className="py-3 pr-4">{claim.reported_issue_title}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {claim.reported_area || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={claim.within_coverage ? "default" : "destructive"}>
                            {claim.within_coverage ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(claim.date_reported).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-0 text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/warranty/claims/${claim.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
