import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/demo/useDemoMode";
import { getDemoTeamInvitations } from "@/utils/demoContractorData";

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitation_token: string;
  invited_by_name: string | null;
  company_name: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

const AVAILABLE_ROLES = [
  { value: "estimator", label: "Construction Agent" },
  { value: "project_coordinator", label: "Project Coordinator" },
  { value: "project_manager", label: "Project Manager" },
  { value: "foreman", label: "Foreman" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "inside_sales", label: "Inside Sales Rep" },
  { value: "outside_sales", label: "Outside Sales Rep" },
  { value: "vendor", label: "Vendor" },
  { value: "architect", label: "Architect" },
  { value: "designer", label: "Designer" },
];

export default function TeamInvitations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setInvitations(getDemoTeamInvitations() as TeamInvitation[]);
      setInviterName("Demo Contractor");
      setLoading(false);
    } else {
      checkAuth();
    }
  }, [isDemoMode]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/contractor/auth");
        return;
      }

      // Get user profile for name and company
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      setInviterName(profile?.full_name || "");

      fetchInvitations();
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/contractor/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Missing Information",
        description: "Please provide email and role",
        variant: "destructive",
      });
      return;
    }

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `Invitation would be sent to ${inviteEmail} for ${inviteRole} role`,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Generate secure token
      const invitationToken = crypto.randomUUID();

      // Create invitation record
      const { data: invitation, error: insertError } = await supabase
        .from("team_invitations")
        .insert({
          contractor_id: session.user.id,
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          invitation_token: invitationToken,
          invited_by_name: inviterName,
          company_name: companyName || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke("send-team-invitation", {
        body: {
          invitationId: invitation.id,
          email: inviteEmail,
          role: inviteRole,
          invitedByName: inviterName || "Your team lead",
          companyName: companyName,
          invitationToken: invitationToken,
        },
      });

      if (emailError) throw emailError;

      toast({
        title: "Invitation Sent",
        description: `Successfully sent invitation to ${inviteEmail}`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("");
      fetchInvitations();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Invitation cancellation simulated",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/accept?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (status === "accepted") {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</Badge>;
    }
    if (status === "expired" || new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Expired</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading...</div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              Team Invitations
            </h1>
            <p className="text-muted-foreground mt-1">
              Invite team members to join your organization
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Send Invitation
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sent Invitations</CardTitle>
            <CardDescription>
              Track and manage invitations you've sent to team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No invitations sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invitation.role.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invitation.status, invitation.expires_at)}
                      </TableCell>
                      <TableCell>{format(new Date(invitation.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(invitation.expires_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {invitation.status === "pending" && new Date(invitation.expires_at) > new Date() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(invitation.invitation_token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Send Invitation Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Team Invitation</DialogTitle>
              <DialogDescription>
                Invite a new team member to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company">Company Name (Optional)</Label>
                <Input
                  id="company"
                  placeholder="Your Company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSendInvitation} disabled={sending || !inviteEmail || !inviteRole}>
                {sending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContractorLayout>
  );
}