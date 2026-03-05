import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, Eye, Mail, Phone, Link as LinkIcon, Calendar, Award, MapPin, Briefcase, Loader2, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AdminSideNav } from "@/components/AdminSideNav";

interface InteriorDesignerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  portfolio_url: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  years_experience: number;
  specializations: string[];
  service_areas: string[];
  certifications: string[];
  design_software: string[];
  project_types: string[];
  professional_references: any;
  why_join: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminInteriorDesignerApplications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<InteriorDesignerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<InteriorDesignerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get initial filter from URL query params
  const urlStatus = searchParams.get('status');
  const initialFilter = (urlStatus === 'pending' || urlStatus === 'approved' || urlStatus === 'rejected') 
    ? urlStatus 
    : 'pending';
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(initialFilter);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update URL when filter changes
  useEffect(() => {
    if (filter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', filter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("interior_designer_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading applications",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: "approved" | "rejected") => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      // If approving, create the designer account first
      if (newStatus === "approved") {
        toast({
          title: "Creating account...",
          description: "Setting up the designer account and credentials.",
        });

        const { error: accountError } = await supabase.functions.invoke("create-designer-account", {
          body: {
            email: application.email,
            name: application.name,
            applicationId: application.id,
          },
        });

        if (accountError) {
          console.error("Error creating account:", accountError);
          throw new Error(`Failed to create account: ${accountError.message}`);
        }

        console.log("Designer account created successfully");
      }

      // Update application status
      const { error } = await supabase
        .from("interior_designer_applications")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Send status notification email (for rejection or as secondary notification for approval)
      if (newStatus === "rejected") {
        try {
          await supabase.functions.invoke("send-designer-application-notification", {
            body: {
              type: "application_rejected",
              designerName: application.name,
              designerEmail: application.email,
              adminNotes: adminNotes || undefined,
            },
          });
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }

      toast({
        title: `Application ${newStatus}`,
        description: newStatus === "approved" 
          ? "The application has been approved and the designer account has been created. A welcome email with login credentials has been sent."
          : "The application has been rejected. A notification email has been sent.",
      });

      setSelectedApp(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating application",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    // Filter by status
    if (filter !== "all" && app.status !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.specializations.some(spec => spec.toLowerCase().includes(query)) ||
        app.service_areas.some(area => area.toLowerCase().includes(query)) ||
        app.project_types.some(type => type.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const SIDEBAR_WIDTH = 240;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
        <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
        <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
          <div className="flex items-center justify-center h-[calc(100vh-56px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
      <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
      
      <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
          <h1 className="text-3xl font-bold">Interior Designer Applications</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage interior designer applications
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, specializations, service areas, or project types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({applications.filter(a => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({applications.filter(a => a.status === "approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({applications.filter(a => a.status === "rejected").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-3">
                        {app.name}
                        {getStatusBadge(app.status)}
                      </CardTitle>
                      <CardDescription>
                        Applied {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setAdminNotes(app.admin_notes || "");
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{app.years_experience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{app.service_areas.length} service areas</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                    {app.specializations.length > 3 && (
                      <Badge variant="outline">
                        +{app.specializations.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {app.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes(app.admin_notes || "");
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes(app.admin_notes || "");
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedApp.name}
                  {getStatusBadge(selectedApp.status)}
                </DialogTitle>
                <DialogDescription>
                  Application submitted {format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedApp.email}`} className="text-primary hover:underline">
                        {selectedApp.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedApp.phone}`} className="text-primary hover:underline">
                        {selectedApp.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Professional Links */}
                {(selectedApp.portfolio_url || selectedApp.website_url || selectedApp.linkedin_url) && (
                  <div>
                    <h3 className="font-semibold mb-3">Professional Links</h3>
                    <div className="space-y-2 text-sm">
                      {selectedApp.portfolio_url && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Portfolio
                          </a>
                        </div>
                      )}
                      {selectedApp.website_url && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a href={selectedApp.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                      {selectedApp.linkedin_url && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            LinkedIn
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h3 className="font-semibold mb-3">Experience</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApp.years_experience} years of professional experience</span>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h3 className="font-semibold mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                {selectedApp.certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.certifications.map((cert) => (
                        <Badge key={cert} variant="outline">
                          <Award className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Software */}
                {selectedApp.design_software.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Design Software</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.design_software.map((software) => (
                        <Badge key={software} variant="outline">
                          {software}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Areas */}
                <div>
                  <h3 className="font-semibold mb-3">Service Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.service_areas.map((area) => (
                      <Badge key={area} variant="secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Project Types */}
                <div>
                  <h3 className="font-semibold mb-3">Project Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.project_types.map((type) => (
                      <Badge key={type} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Why Join */}
                <div>
                  <h3 className="font-semibold mb-3">Why Join SmartReno</h3>
                  <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {selectedApp.why_join}
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this application..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Review Information */}
                {selectedApp.reviewed_at && (
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Reviewed {format(new Date(selectedApp.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    {selectedApp.admin_notes && (
                      <p className="mt-2">{selectedApp.admin_notes}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {selectedApp.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleUpdateStatus(selectedApp.id, "approved")}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Reject Application
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
