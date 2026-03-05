import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoPurchaseOrders } from "@/utils/demoContractorData";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
} from "lucide-react";
import { CreatePurchaseOrderDialog } from "@/components/purchasing/CreatePurchaseOrderDialog";
import { RecordReceiptDialog } from "@/components/purchasing/RecordReceiptDialog";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  project_id: string;
  order_date: string;
  expected_delivery: string;
  actual_delivery: string;
  status: string;
  total: number;
  approved_by: string;
  approved_at: string;
  created_at: string;
  vendors: {
    company_name: string;
  };
}

export default function PurchaseOrders() {
  const { isDemoMode } = useDemoMode();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, [isDemoMode]);

  useEffect(() => {
    filterPOs();
  }, [purchaseOrders, searchQuery, statusFilter]);

  const fetchPurchaseOrders = async () => {
    // Demo mode - use demo data
    if (isDemoMode) {
      const demoPOs = getDemoPurchaseOrders();
      setPurchaseOrders(demoPOs as PurchaseOrder[]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors(company_name)
        `)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load purchase orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPOs = () => {
    let filtered = [...purchaseOrders];

    if (statusFilter !== "all") {
      filtered = filtered.filter(po => po.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(po =>
        po.po_number?.toLowerCase().includes(query) ||
        po.vendors?.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredPOs(filtered);
  };

  const handleEditPO = (po: PurchaseOrder) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Editing disabled in demo mode" });
      return;
    }
    setEditingPO(po);
    setShowCreateDialog(true);
  };

  const handleRecordReceipt = (po: PurchaseOrder) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Recording disabled in demo mode" });
      return;
    }
    setSelectedPO(po);
    setShowReceiptDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setShowReceiptDialog(false);
    setEditingPO(null);
    setSelectedPO(null);
  };

  const handlePOSaved = () => {
    fetchPurchaseOrders();
    handleCloseDialog();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      draft: { variant: "secondary", icon: FileText },
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      ordered: { variant: "default", icon: Package },
      in_transit: { variant: "default", icon: Truck },
      delivered: { variant: "default", icon: CheckCircle2 },
      cancelled: { variant: "destructive", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const totalStats = {
    total: filteredPOs.length,
    pending: filteredPOs.filter(po => po.status === 'pending').length,
    approved: filteredPOs.filter(po => po.status === 'approved').length,
    delivered: filteredPOs.filter(po => po.status === 'delivered').length,
    totalValue: filteredPOs.reduce((sum, po) => sum + (parseFloat(po.total?.toString() || '0')), 0),
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="text-center py-12">Loading purchase orders...</div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Purchase Orders</h1>
              <p className="text-muted-foreground">
                Manage vendor purchase orders and deliveries
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by PO number or vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.delivered}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Orders - Desktop Table */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                {filteredPOs.length} purchase order(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPOs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No purchase orders found</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First PO
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPOs.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.po_number}</TableCell>
                          <TableCell>{po.vendors?.company_name || 'Unknown'}</TableCell>
                          <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {po.expected_delivery 
                              ? format(new Date(po.expected_delivery), 'MMM dd, yyyy')
                              : 'Not set'}
                          </TableCell>
                          <TableCell>{getStatusBadge(po.status)}</TableCell>
                          <TableCell className="text-right">
                            ${parseFloat(po.total?.toString() || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditPO(po)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {po.status === 'in_transit' || po.status === 'ordered' ? (
                                  <DropdownMenuItem onClick={() => handleRecordReceipt(po)}>
                                    <Package className="mr-2 h-4 w-4" />
                                    Record Receipt
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Orders - Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredPOs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No purchase orders found</p>
                    <Button onClick={() => setShowCreateDialog(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First PO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPOs.map((po) => (
                <Card key={po.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{po.po_number}</CardTitle>
                        <CardDescription className="truncate">
                          {po.vendors?.company_name || 'Unknown Vendor'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditPO(po)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {po.status === 'in_transit' || po.status === 'ordered' ? (
                            <DropdownMenuItem onClick={() => handleRecordReceipt(po)}>
                              <Package className="mr-2 h-4 w-4" />
                              Record Receipt
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Order Date</span>
                      <span className="text-sm font-medium">
                        {format(new Date(po.order_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Expected</span>
                      <span className="text-sm font-medium">
                        {po.expected_delivery 
                          ? format(new Date(po.expected_delivery), 'MMM dd, yyyy')
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-lg font-bold">
                        ${parseFloat(po.total?.toString() || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <CreatePurchaseOrderDialog
        open={showCreateDialog}
        onClose={handleCloseDialog}
        onSaved={handlePOSaved}
        purchaseOrder={editingPO}
      />

      {selectedPO && (
        <RecordReceiptDialog
          open={showReceiptDialog}
          onClose={handleCloseDialog}
          onSaved={handlePOSaved}
          purchaseOrder={selectedPO}
        />
      )}
    </ContractorLayout>
  );
}
