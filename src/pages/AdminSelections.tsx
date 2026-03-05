import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Filter, CheckCircle2, Clock, AlertCircle, Check, X, MessageSquare } from "lucide-react";
import { AdminSideNav } from "@/components/AdminSideNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { AddSelectionDialog } from "@/components/admin/AddSelectionDialog";
import { SendApprovalDialog } from "@/components/admin/SendApprovalDialog";
import { toast } from "sonner";

interface Selection {
  id: string;
  project_name: string;
  client_name: string;
  category: string;
  item_description: string;
  status: 'pending' | 'approved' | 'rejected';
  deadline: string | null;
  notes: string | null;
}

export default function AdminSelections() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [selectedForApproval, setSelectedForApproval] = useState<Selection | null>(null);

  const SIDEBAR_WIDTH = 240;

  const fetchSelections = async () => {
    try {
      const { data, error } = await supabase
        .from("material_selections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSelections((data || []) as Selection[]);
    } catch (error) {
      console.error("Error fetching selections:", error);
      toast.error("Failed to load selections");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/auth");
        return;
      }
      await fetchSelections();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("material_selections")
        .update({ 
          status: newStatus,
          reviewed_by: user?.id 
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Selection ${newStatus}`);
      await fetchSelections();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredSelections = selections.filter(selection =>
    selection.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    selection.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    selection.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    selection.item_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: selections.length,
    pending: selections.filter(s => s.status === 'pending').length,
    approved: selections.filter(s => s.status === 'approved').length,
    rejected: selections.filter(s => s.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-background/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-primary to-accent" />
            <h1 className="text-base font-semibold tracking-wide">SmartReno Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin/selections")}
              className="hidden md:flex"
            >
              Client Selections
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin/change-orders")}
              className="hidden md:flex"
            >
              Change Orders
            </Button>
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 h-9 pl-9 pr-3 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <NotificationBell />
            <SettingsDropdown userRole="admin" />
          </div>
        </div>
      </div>

      {/* Admin Side Nav */}
      <AdminSideNav 
        topOffsetPx={56} 
        widthPx={SIDEBAR_WIDTH} 
        collapsedWidthPx={56}
        role="admin"
        badges={{
          selections_pending: stats.pending,
        }}
      />

      {/* Main Content */}
      <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
        <div className="container mx-auto px-6 py-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Breadcrumb */}
          <div className="text-xs text-muted-foreground mb-2">Admin / Selections</div>
          <h1 className="text-[22px] font-semibold mb-6">Client Selections</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Selections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">All material selections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground mt-1">Need revision</p>
              </CardContent>
            </Card>
          </div>

          {/* Selections Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Selections</CardTitle>
                  <CardDescription>Manage client material and finish selections</CardDescription>
                </div>
                <AddSelectionDialog onSuccess={fetchSelections} />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search selections..."
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
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Item Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSelections.map((selection) => (
                    <TableRow key={selection.id}>
                      <TableCell className="font-medium">{selection.project_name}</TableCell>
                      <TableCell>{selection.client_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{selection.category}</Badge>
                      </TableCell>
                      <TableCell>{selection.item_description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selection.status)}
                          <Badge className={getStatusColor(selection.status)}>
                            {selection.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {selection.deadline ? new Date(selection.deadline).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {selection.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {selection.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => setSelectedForApproval(selection)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Send SMS
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(selection.id, 'approved')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(selection.id, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {selection.status !== 'pending' && (
                            <span className="text-xs text-muted-foreground">
                              {selection.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send Approval Dialog */}
      {selectedForApproval && (
        <SendApprovalDialog
          selection={selectedForApproval}
          open={!!selectedForApproval}
          onOpenChange={(open) => !open && setSelectedForApproval(null)}
          onSuccess={fetchSelections}
        />
      )}
    </div>
  );
}
