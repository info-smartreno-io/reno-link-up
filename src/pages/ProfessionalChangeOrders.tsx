import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, FileEdit, DollarSign, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CreateChangeOrderDialog } from "@/components/changeorders/CreateChangeOrderDialog";
import { toast } from "sonner";

interface ChangeOrder {
  id: string;
  project_name: string;
  client_name: string;
  change_order_number: string;
  description: string;
  original_amount: number;
  change_amount: number;
  new_total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  reason: string | null;
}

export default function ProfessionalChangeOrders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);

  const fetchChangeOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("change_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChangeOrders((data || []) as ChangeOrder[]);
    } catch (error) {
      console.error("Error fetching change orders:", error);
      toast.error("Failed to load change orders");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      await fetchChangeOrders();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredChangeOrders = changeOrders.filter(order =>
    order.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.change_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(o => o.status === 'pending').length,
    approved: changeOrders.filter(o => o.status === 'approved').length,
    totalValue: changeOrders.reduce((sum, o) => sum + Number(o.change_amount), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Change Orders</h1>
          <p className="text-muted-foreground">Create and manage project change orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All change orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to execute</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Change amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Change Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Change Orders</CardTitle>
                <CardDescription>Create proposals using AI-generated scope</CardDescription>
              </div>
              <CreateChangeOrderDialog onSuccess={fetchChangeOrders} />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search change orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CO Number</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Change Amount</TableHead>
                  <TableHead className="text-right">New Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChangeOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No change orders found. Create your first change order using AI!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChangeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.change_order_number}</TableCell>
                      <TableCell>{order.project_name}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.description}</TableCell>
                      <TableCell className="text-right">
                        <span className={Number(order.change_amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(order.change_amount) >= 0 ? '+' : ''}${Number(order.change_amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">${Number(order.new_total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
