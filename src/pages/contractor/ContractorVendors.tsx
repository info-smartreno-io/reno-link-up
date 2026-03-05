import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Archive,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  Package,
} from "lucide-react";
import { AddEditVendorDialog } from "@/components/contractor/AddEditVendorDialog";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoVendors } from "@/utils/demoContractorData";

interface Vendor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  categories: any; // JSON field from database
  rating: number;
  payment_terms: string;
  status: string;
  notes: string;
  website: string;
  tax_id: string;
  created_at: string;
  updated_at: string;
}

export default function ContractorVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setVendors(getDemoVendors());
      setLoading(false);
      return;
    }
    fetchVendors();
  }, [isDemoMode]);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchQuery, categoryFilter, statusFilter]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = [...vendors];

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(v => v.status === 'active');
    } else if (statusFilter === "archived") {
      filtered = filtered.filter(v => v.status === 'inactive');
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(v => {
        const categories = Array.isArray(v.categories) ? v.categories : [];
        return categories.includes(categoryFilter);
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.company_name?.toLowerCase().includes(query) ||
        v.contact_name?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredVendors(filtered);
  };

  const handleArchiveVendor = async (vendorId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('vendors')
        .update({ status: newStatus })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vendor ${currentStatus === 'active' ? 'archived' : 'restored'} successfully`,
      });

      fetchVendors();
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor",
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingVendor(null);
  };

  const handleVendorSaved = () => {
    fetchVendors();
    handleCloseDialog();
  };

  const getServiceCategories = () => {
    const categories = new Set<string>();
    vendors.forEach(vendor => {
      const cats = Array.isArray(vendor.categories) ? vendor.categories : [];
      cats.forEach((cat: string) => categories.add(cat));
    });
    return Array.from(categories).sort();
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="text-center py-12">Loading vendors...</div>
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
              <h1 className="text-3xl font-bold mb-2">Vendor Management</h1>
              <p className="text-muted-foreground">
                Manage your suppliers and service providers
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getServiceCategories().map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vendors.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendors.filter(v => v.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getServiceCategories().length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendors.length > 0
                    ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1)
                    : '0.0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendors Table - Desktop */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>
                {filteredVendors.length} vendor(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No vendors found</p>
                  <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Vendor
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Payment Terms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor.company_name}</p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{vendor.address || 'No address'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{vendor.contact_name}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{vendor.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{vendor.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(vendor.categories) && vendor.categories.slice(0, 2).map((cat: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {Array.isArray(vendor.categories) && vendor.categories.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{vendor.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{renderRating(vendor.rating || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span>{vendor.payment_terms || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={vendor.status === 'active' ? "default" : "secondary"}>
                              {vendor.status === 'active' ? "Active" : "Archived"}
                            </Badge>
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
                                <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleArchiveVendor(vendor.id, vendor.status)}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  {vendor.status === 'active' ? 'Archive' : 'Restore'}
                                </DropdownMenuItem>
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

          {/* Vendors - Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredVendors.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No vendors found</p>
                    <Button onClick={() => setShowAddDialog(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Vendor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredVendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{vendor.company_name}</CardTitle>
                        <CardDescription className="truncate">{vendor.contact_name}</CardDescription>
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
                          <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveVendor(vendor.id, vendor.status)}>
                            <Archive className="mr-2 h-4 w-4" />
                            {vendor.status === 'active' ? 'Archive' : 'Restore'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm">{vendor.address || 'No address'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-2 border-t">
                      {Array.isArray(vendor.categories) && vendor.categories.map((cat: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      {renderRating(vendor.rating || 0)}
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Payment</span>
                      <span className="text-sm font-medium">{vendor.payment_terms || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={vendor.status === 'active' ? "default" : "secondary"}>
                        {vendor.status === 'active' ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <AddEditVendorDialog
        open={showAddDialog}
        onClose={handleCloseDialog}
        onSaved={handleVendorSaved}
        vendor={editingVendor}
      />
    </ContractorLayout>
  );
}
