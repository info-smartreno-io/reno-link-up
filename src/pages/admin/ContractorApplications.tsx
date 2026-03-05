import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface ContractorApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  license_number: string | null;
  years_experience: number | null;
  service_areas: string[] | null;
  specialties: string[] | null;
  insurance_verified: boolean;
  license_verified: boolean;
  notes: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
}

export default function ContractorApplications() {
  const [applications, setApplications] = useState<ContractorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ContractorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: ContractorApplication) => {
    setActionLoading(true);
    try {
      // Create contractor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: application.user_id,
          role: "contractor",
        });

      if (roleError) throw roleError;

      // Update application status
      const { error: updateError } = await supabase
        .from("contractor_applications")
        .update({
          status: "approved",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      // Create contractor record if needed
      const { data: contractorData } = await supabase
        .from("contractors")
        .select("id")
        .eq("id", application.user_id)
        .single();

      if (!contractorData) {
        await supabase.from("contractors").insert({
          id: application.user_id,
          name: application.company_name || application.full_name,
          email: application.email,
          phone: application.phone,
          license_number: application.license_number,
          is_active: true,
        });
      }

      toast({
        title: "Application approved",
        description: `${application.full_name} has been approved as a contractor.`,
      });

      fetchApplications();
      setSelectedApp(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (application: ContractorApplication) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("contractor_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Application rejected",
        description: `${application.full_name}'s application has been rejected.`,
      });

      fetchApplications();
      setSelectedApp(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "under_review":
        return <Badge variant="secondary">Under Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8">Loading applications...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contractor Applications</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve contractor registration applications
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.full_name}</TableCell>
                <TableCell>{app.email}</TableCell>
                <TableCell>{app.company_name || "-"}</TableCell>
                <TableCell>{app.license_number || "-"}</TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell>
                  {new Date(app.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(app)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectionReason("");
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review contractor application for {selectedApp?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.full_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.company_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">License Number</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.license_number || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Years Experience</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.years_experience || "Not provided"}
                  </p>
                </div>
              </div>

              {selectedApp.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.notes}
                  </p>
                </div>
              )}

              {selectedApp.status === "rejected" && selectedApp.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-destructive">
                    Rejection Reason
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.rejection_reason}
                  </p>
                </div>
              )}

              {selectedApp.status === "pending" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Rejection Reason (if rejecting)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      className="mt-2"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApp(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedApp)}
                      disabled={actionLoading || !rejectionReason.trim()}
                    >
                      Reject Application
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedApp)}
                      disabled={actionLoading}
                    >
                      Approve Application
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
