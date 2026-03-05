import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, RefreshCw, Eye, Download, CheckCircle, XCircle, MessageSquare, Filter } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSideNav } from "@/components/AdminSideNav";

interface Proposal {
  id: string;
  project_id: string;
  architect_id: string;
  proposal_amount: number;
  design_phase: string;
  estimated_timeline: string | null;
  notes: string | null;
  terms: string | null;
  status: string;
  submitted_at: string;
  attachment_urls: string[] | null;
  line_items: Array<{ description: string; amount: number }> | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  architect_name: string | null;
  project_name: string | null;
}

export default function AdminArchitectProposals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string>(statusFilter || 'all');

  useEffect(() => {
    checkAuth();
    fetchProposals();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      setCurrentStatusFilter(statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (currentStatusFilter === 'all') {
      setFilteredProposals(proposals);
    } else {
      setFilteredProposals(proposals.filter(p => p.status === currentStatusFilter));
    }
  }, [currentStatusFilter, proposals]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      // Fetch all proposals
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("architect_proposals")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (proposalsError) throw proposalsError;

      // Fetch architect profiles
      const architectIds = [...new Set(proposalsData?.map(p => p.architect_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", architectIds);

      // Fetch projects
      const projectIds = [...new Set(proposalsData?.map(p => p.project_id) || [])];
      const { data: projects } = await supabase
        .from("architect_projects")
        .select("id, project_name")
        .in("id", projectIds);

      // Enrich proposals with architect and project names
      const enriched: Proposal[] = (proposalsData || []).map((p: any) => ({
        ...p,
        architect_name: profiles?.find(prof => prof.id === p.architect_id)?.full_name || null,
        project_name: projects?.find(proj => proj.id === p.project_id)?.project_name || null,
      }));

      setProposals(enriched);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast({
        title: "Error",
        description: "Failed to load proposals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (proposal: Proposal, action: 'approve' | 'reject' | 'revision') => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setAdminNotes(proposal.admin_notes || "");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedProposal || !reviewAction) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const statusMap = {
        approve: 'accepted',
        reject: 'rejected',
        revision: 'revision_requested',
      };

      const { error } = await supabase
        .from("architect_proposals")
        .update({
          status: statusMap[reviewAction],
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Proposal ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'marked for revision'}`,
      });

      setReviewDialogOpen(false);
      setSelectedProposal(null);
      setAdminNotes("");
      setReviewAction(null);
      fetchProposals();
    } catch (error: any) {
      console.error("Error reviewing proposal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to review proposal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-700", label: "Pending" },
      accepted: { className: "bg-green-100 text-green-700", label: "Approved" },
      rejected: { className: "bg-red-100 text-red-700", label: "Rejected" },
      revision_requested: { className: "bg-blue-100 text-blue-700", label: "Revision Requested" },
    };
    return variants[status] || variants.pending;
  };

  const handleDownloadAttachment = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
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
        <div className="container mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Architect Proposals</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage architect design proposals
              {currentStatusFilter !== 'all' && ` - Showing ${currentStatusFilter.replace('_', ' ')} proposals`}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={currentStatusFilter} onValueChange={setCurrentStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revision_requested">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchProposals}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStatusFilter === 'all' 
                ? `All Proposals (${filteredProposals.length})` 
                : `${filteredProposals.length} ${currentStatusFilter.replace('_', ' ')} proposal${filteredProposals.length !== 1 ? 's' : ''}`}
            </CardTitle>
            <CardDescription>Review, approve, reject, or request revisions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Architect</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      {proposal.architect_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {proposal.project_name || `Project #${proposal.project_id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>{proposal.design_phase}</TableCell>
                    <TableCell>${proposal.proposal_amount.toLocaleString()}</TableCell>
                    <TableCell>{proposal.estimated_timeline || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(proposal.status).className}>
                        {getStatusBadge(proposal.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(proposal.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {proposal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog(proposal, 'approve')}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog(proposal, 'revision')}
                              title="Request Revision"
                            >
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog(proposal, 'reject')}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedProposal(proposal)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProposals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {currentStatusFilter === 'all' 
                        ? 'No proposals found' 
                        : `No ${currentStatusFilter.replace('_', ' ')} proposals found`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' && 'Approve Proposal'}
                {reviewAction === 'reject' && 'Reject Proposal'}
                {reviewAction === 'revision' && 'Request Revision'}
              </DialogTitle>
              <DialogDescription>
                {selectedProposal && `${selectedProposal.architect_name} - ${selectedProposal.project_name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="admin-notes">
                  {reviewAction === 'revision' ? 'Revision Notes (Required)' : 'Admin Notes (Optional)'}
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'revision'
                      ? 'Explain what needs to be revised...'
                      : 'Add any notes about this decision...'
                  }
                  className="mt-2 min-h-[120px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={submitting || (reviewAction === 'revision' && !adminNotes.trim())}
                  variant={reviewAction === 'reject' ? 'destructive' : 'default'}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {reviewAction === 'approve' && 'Approve Proposal'}
                  {reviewAction === 'reject' && 'Reject Proposal'}
                  {reviewAction === 'revision' && 'Request Revision'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Proposal Details Dialog */}
        {selectedProposal && !reviewDialogOpen && (
          <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Proposal Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Architect</Label>
                    <p className="font-medium">{selectedProposal.architect_name || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Project</Label>
                    <p className="font-medium">{selectedProposal.project_name || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Design Phase</Label>
                    <p>{selectedProposal.design_phase}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-semibold">${selectedProposal.proposal_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Timeline</Label>
                    <p>{selectedProposal.estimated_timeline || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusBadge(selectedProposal.status).className}>
                      {getStatusBadge(selectedProposal.status).label}
                    </Badge>
                  </div>
                </div>

                {selectedProposal.line_items && selectedProposal.line_items.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Cost Breakdown</Label>
                    <div className="border rounded-lg p-3 mt-2 space-y-2">
                      {selectedProposal.line_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProposal.notes && (
                  <div>
                    <Label className="text-muted-foreground">Proposal Notes</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedProposal.notes}</p>
                  </div>
                )}

                {selectedProposal.terms && (
                  <div>
                    <Label className="text-muted-foreground">Terms & Conditions</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedProposal.terms}</p>
                  </div>
                )}

                {selectedProposal.attachment_urls && selectedProposal.attachment_urls.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Attachments</Label>
                    <div className="border rounded-lg p-3 mt-2 space-y-2">
                      {selectedProposal.attachment_urls.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1">
                            {url.split('/').pop()?.split('_').slice(1).join('_') || `Attachment ${idx + 1}`}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadAttachment(url)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProposal.admin_notes && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground">Admin Notes</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedProposal.admin_notes}</p>
                    {selectedProposal.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed on {new Date(selectedProposal.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>
    </div>
  );
}
