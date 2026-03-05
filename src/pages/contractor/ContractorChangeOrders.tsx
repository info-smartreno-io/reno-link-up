import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Plus, FileEdit, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoChangeOrders, getDemoProjects } from "@/utils/demoContractorData";

interface ChangeOrder {
  id: string;
  change_order_number: string;
  project_name: string;
  client_name: string;
  description: string;
  reason: string | null;
  status: string;
  original_amount: number;
  change_amount: number;
  new_total_amount: number;
  created_at: string;
  approved_at: string | null;
}

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"];

export default function ContractorChangeOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isDemoMode) {
      const demoProjects = getDemoProjects();
      const demoData = getDemoChangeOrders().map(co => {
        const project = demoProjects.find(p => p.id === co.project_id);
        return {
          id: co.id,
          change_order_number: co.change_order_number,
          project_name: co.project_name,
          client_name: project?.client_name || "Demo Client",
          description: co.description,
          reason: co.description,
          status: co.status,
          original_amount: 45000,
          change_amount: co.change_amount,
          new_total_amount: 45000 + co.change_amount,
          created_at: co.created_at,
          approved_at: co.approved_at,
        };
      });
      setChangeOrders(demoData);
      setLoading(false);
      return;
    }
    checkAuthAndFetch();
  }, [isDemoMode]);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchChangeOrders();
  };

  const fetchChangeOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("change_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching change orders:", error);
      toast({ title: "Error loading change orders", variant: "destructive" });
    } else {
      setChangeOrders(data || []);
    }
    setLoading(false);
  };

  const filteredOrders = changeOrders.filter((co) => {
    const matchesSearch =
      co.change_order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || co.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; className: string }> = {
      pending: { icon: <Clock className="h-3 w-3 mr-1" />, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      approved: { icon: <Check className="h-3 w-3 mr-1" />, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      rejected: { icon: <X className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    const { icon, className } = config[status] || config.pending;
    return (
      <Badge className={`flex items-center ${className}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter((co) => co.status === "pending").length,
    approved: changeOrders.filter((co) => co.status === "approved").length,
    totalImpact: changeOrders.filter((co) => co.status === "approved").reduce((sum, co) => sum + (co.change_amount || 0), 0),
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Orders</h1>
          <p className="text-muted-foreground">Manage project scope changes and cost adjustments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Change Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total COs</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalImpact >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.totalImpact >= 0 ? "+" : ""}${stats.totalImpact.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search change orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Change Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CO #</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>New Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No change orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((co) => (
                <TableRow key={co.id}>
                  <TableCell className="font-medium">{co.change_order_number}</TableCell>
                  <TableCell>{co.project_name}</TableCell>
                  <TableCell>{co.client_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{co.description}</TableCell>
                  <TableCell>${co.original_amount?.toLocaleString()}</TableCell>
                  <TableCell className={co.change_amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {co.change_amount >= 0 ? "+" : ""}${co.change_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>${co.new_total_amount?.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(co.status)}</TableCell>
                  <TableCell>{format(new Date(co.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      </div>
    </ContractorLayout>
  );
}
