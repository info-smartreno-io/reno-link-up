import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSmartEstimateList } from "@/hooks/useSmartEstimate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Search, Filter, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-500",
};

export default function AdminSmartEstimates() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: estimates = [], isLoading } = useSmartEstimateList(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const filtered = estimates.filter((e: any) => {
    if (!search) return true;
    const name = (e.leads?.name || e.projects?.client_name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Smart Estimates</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Estimate Queue</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading estimates...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No smart estimates found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project / Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((est: any) => (
                    <TableRow key={est.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/smart-estimates/${est.id}`)}>
                      <TableCell className="font-medium">
                        {est.leads?.name || est.projects?.client_name || "—"}
                        <span className="block text-xs text-muted-foreground">{est.leads?.project_type || ""}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[est.status] || ""}>{est.status?.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={est.estimate_completion_percent || 0} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">{est.estimate_completion_percent || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{est.estimate_confidence_score || 0}/100</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {est.updated_at ? format(new Date(est.updated_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
