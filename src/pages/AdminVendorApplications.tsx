import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, CheckCircle2, XCircle, Search, Calendar, FileText, Download, Image as ImageIcon, ExternalLink, ArrowLeft } from "lucide-react";
import { AdminSideNav } from "@/components/AdminSideNav";

type VendorApplication = {
  id: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  product_categories: string;
  service_areas: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  license_url: string | null;
  insurance_url: string | null;
  portfolio_urls: string[] | null;
};

export default function AdminVendorApplications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as VendorApplication[]) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Applications",
        description: error.message || "Could not load vendor applications.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.company_name.toLowerCase().includes(query) ||
        app.contact_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.product_categories.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const openApplicationDialog = (application: VendorApplication) => {
    setSelectedApplication(application);
    setAdminNotes(application.admin_notes || "");
    setNewStatus(application.status);
    setDialogOpen(true);
  };

  const updateApplication = async () => {
    if (!selectedApplication) return;

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const previousStatus = selectedApplication.status;

      const { error } = await supabase
        .from('vendor_applications')
        .update({
          status: newStatus,
          admin_notes: adminNotes.trim() || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      // If status changed to approved, create account and send welcome email
      if (newStatus === 'approved' && previousStatus !== 'approved') {
        console.log('Creating vendor account for approved application');
        
        const { error: accountError } = await supabase.functions.invoke('create-vendor-account', {
          body: {
            applicationId: selectedApplication.id,
            email: selectedApplication.email,
            companyName: selectedApplication.company_name,
          },
        });

        if (accountError) {
          console.error('Error creating vendor account:', accountError);
          toast({
            variant: "destructive",
            title: "Account Creation Warning",
            description: "Application approved but failed to create user account. Please create manually.",
          });
        }
      }

      // Send notification email for rejected applications
      if (newStatus === 'rejected' && previousStatus !== 'rejected') {
        console.log('Sending rejection notification');
        
        const { error: notificationError } = await supabase.functions.invoke('send-designer-application-notification', {
          body: {
            type: 'application_rejected',
            email: selectedApplication.email,
            name: selectedApplication.contact_name,
            companyName: selectedApplication.company_name,
            adminNotes: adminNotes.trim() || undefined,
          },
        });

        if (notificationError) {
          console.error('Error sending rejection notification:', notificationError);
        }
      }

      toast({
        title: "Application Updated",
        description: `${selectedApplication.company_name}'s application has been updated.`,
      });

      setDialogOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update application.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const SIDEBAR_WIDTH = 240;

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30 fixed top-14 left-0 right-0 z-40 bg-background h-14" />
        <AdminSideNav topOffsetPx={112} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
        <div className="pt-28" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
          <div className="flex items-center justify-center h-[calc(100vh-112px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vendor Applications - Admin Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <SiteNavbar />

      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30 fixed top-14 left-0 right-0 z-40 bg-background h-14" />
        <AdminSideNav topOffsetPx={112} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
        
        <div className="pt-28" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
          <div className="container mx-auto px-4">
            <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vendor Applications</h1>
            <p className="text-muted-foreground">Review and manage vendor partnership applications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, contact, email, or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full md:w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{application.company_name}</h3>
                            <p className="text-sm text-muted-foreground">{application.contact_name}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 mt-4 text-sm">
                          <div>
                            <span className="font-medium">Email:</span> {application.email}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {application.phone}
                          </div>
                          <div>
                            <span className="font-medium">Categories:</span> {application.product_categories}
                          </div>
                          {application.service_areas && (
                            <div>
                              <span className="font-medium">Service Areas:</span> {application.service_areas}
                            </div>
                          )}
                        </div>
                        {application.message && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm">{application.message}</p>
                          </div>
                        )}
                        
                        {/* Document Links */}
                        {(application.license_url || application.insurance_url || (application.portfolio_urls && application.portfolio_urls.length > 0)) && (
                          <div className="mt-4 p-3 border rounded-md">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Uploaded Documents
                            </h4>
                            <div className="space-y-2">
                              {application.license_url && (
                                <a
                                  href={application.license_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Download className="h-3 w-3" />
                                  Business License
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {application.insurance_url && (
                                <a
                                  href={application.insurance_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Download className="h-3 w-3" />
                                  Insurance Certificate
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {application.portfolio_urls && application.portfolio_urls.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                    <ImageIcon className="h-3 w-3" />
                                    Portfolio Images ({application.portfolio_urls.length})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {application.portfolio_urls.map((url, index) => (
                                      <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative block w-20 h-20 rounded-md overflow-hidden border-2 border-border hover:border-primary transition-colors"
                                      >
                                        <img
                                          src={url}
                                          alt={`Portfolio ${index + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted {new Date(application.created_at).toLocaleDateString()}</span>
                          {application.reviewed_at && (
                            <span className="ml-2">• Reviewed {new Date(application.reviewed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => openApplicationDialog(application)}>
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application - {selectedApplication?.company_name}</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              {/* Application Details Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Contact:</span> {selectedApplication.contact_name}</div>
                  <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedApplication.phone}</div>
                  <div><span className="font-medium">Submitted:</span> {new Date(selectedApplication.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Services:</span> {selectedApplication.product_categories}
                </div>
                {selectedApplication.service_areas && (
                  <div className="text-sm">
                    <span className="font-medium">Service Areas:</span> {selectedApplication.service_areas}
                  </div>
                )}
                {selectedApplication.message && (
                  <div className="text-sm">
                    <span className="font-medium">Message:</span>
                    <p className="mt-1 text-muted-foreground">{selectedApplication.message}</p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              {(selectedApplication.license_url || selectedApplication.insurance_url || (selectedApplication.portfolio_urls && selectedApplication.portfolio_urls.length > 0)) && (
                <div className="p-4 border rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Uploaded Documents
                  </h4>
                  <div className="space-y-3">
                    {selectedApplication.license_url && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Business License</Label>
                        <a
                          href={selectedApplication.license_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline mt-1"
                        >
                          <Download className="h-4 w-4" />
                          View/Download License
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedApplication.insurance_url && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Insurance Certificate</Label>
                        <a
                          href={selectedApplication.insurance_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline mt-1"
                        >
                          <Download className="h-4 w-4" />
                          View/Download Insurance
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedApplication.portfolio_urls && selectedApplication.portfolio_urls.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Portfolio Images ({selectedApplication.portfolio_urls.length})</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {selectedApplication.portfolio_urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                            >
                              <img
                                src={url}
                                alt={`Portfolio image ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Image {index + 1}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add internal notes about this application..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    disabled={updating}
                  />
                </div>

                {selectedApplication.admin_notes && (
                  <div className="p-3 bg-muted rounded-md">
                    <Label className="text-xs">Previous Notes:</Label>
                    <p className="text-sm mt-1">{selectedApplication.admin_notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={updating}>
                  Cancel
                </Button>
                <Button onClick={updateApplication} disabled={updating}>
                  {updating ? "Updating..." : "Update Application"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
