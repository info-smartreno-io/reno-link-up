import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2, MoreHorizontal, Plus, Search, Package, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AdminSideNav } from "@/components/AdminSideNav";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { CreatePurchaseOrderDialog } from "@/components/purchasing/CreatePurchaseOrderDialog";

// Mock data for initial display - replace with Supabase queries
const purchaseOrders = [
  {
    id: "PO-1001",
    vendor: "ABC Building Supply",
    project: "Ridgewood Kitchen Remodel",
    orderDate: "2025-11-15",
    expectedDelivery: "2025-11-22",
    status: "Pending",
    total: 8450.00,
    items: 12,
  },
  {
    id: "PO-1002",
    vendor: "Premium Tile Co.",
    project: "Paramus Bathroom Upgrade",
    orderDate: "2025-11-10",
    expectedDelivery: "2025-11-18",
    status: "Shipped",
    total: 3280.00,
    items: 8,
  },
  {
    id: "PO-1003",
    vendor: "Luxury Fixtures Inc.",
    project: "Hoboken Addition",
    orderDate: "2025-11-08",
    expectedDelivery: "2025-11-15",
    status: "Delivered",
    total: 15600.00,
    items: 6,
  },
  {
    id: "PO-1004",
    vendor: "ABC Building Supply",
    project: "Fair Lawn Basement Finish",
    orderDate: "2025-11-05",
    expectedDelivery: "2025-11-12",
    status: "Cancelled",
    total: 5200.00,
    items: 15,
  },
];

export default function AdminPurchasing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredOrders = purchaseOrders.filter((order) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      shipped: "bg-blue-100 text-blue-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status.toLowerCase()] || "bg-gray-200 text-gray-700"}`}>
        {status}
      </Badge>
    );
  };

  // Calculate summary stats
  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.total, 0);
  const pendingOrders = purchaseOrders.filter(po => po.status === "Pending").length;
  const deliveredThisMonth = purchaseOrders.filter(po => po.status === "Delivered").length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNav />
      
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold">Purchasing</h1>
            <SettingsDropdown userRole="admin" />
          </div>
        </header>

        <main className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Spend (Month)</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">${totalSpend.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {purchaseOrders.length} purchase orders
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Orders</CardTitle>
                <Package className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{pendingOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting delivery or processing
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Delivered (Month)</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{deliveredThisMonth}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders completed this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Orders Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by PO #, vendor, or project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">Purchase Orders</CardTitle>
              <CardDescription>Track and manage all material and equipment orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="text-sm font-medium text-slate-500">
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.vendor}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.project}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(order.expectedDelivery).toLocaleDateString()}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">${order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Package className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Print PO
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No purchase orders found. Create your first purchase order to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">Vendor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your vendor relationships, contact information, and pricing agreements.
                </p>
                <Button variant="outline" className="w-full">
                  View Vendors
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">Material Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and manage your material catalog with pricing and availability.
                </p>
                <Button variant="outline" className="w-full">
                  View Catalog
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CreatePurchaseOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSaved={() => {
          toast({
            title: "Success",
            description: "Purchase order created successfully",
          });
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}
