import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Copy, Check, Users, MoreVertical, Mail, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoTeamMembers } from "@/utils/demoContractorData";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  permissions: any;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Invitation {
  id: string;
  invitation_token: string;
  role: string;
  status: string;
  current_uses: number;
  max_uses: number;
  expires_at: string;
  created_at: string;
  invited_email: string | null;
}

const AVAILABLE_ROLES = [
  { value: "project_manager", label: "Project Manager" },
  { value: "field_worker", label: "Field Worker" },
  { value: "estimator_team", label: "Estimator" },
  { value: "office_admin", label: "Office Admin" },
  { value: "inside_sales", label: "Inside Sales Rep" },
  { value: "project_coordinator", label: "Project Coordinator" },
];

const ROLE_COLORS: Record<string, string> = {
  project_manager: "bg-blue-100 text-blue-700 border-blue-200",
  field_worker: "bg-green-100 text-green-700 border-green-200",
  estimator_team: "bg-purple-100 text-purple-700 border-purple-200",
  office_admin: "bg-orange-100 text-orange-700 border-orange-200",
  inside_sales: "bg-cyan-100 text-cyan-700 border-cyan-200",
  project_coordinator: "bg-pink-100 text-pink-700 border-pink-200",
};

export default function TeamManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      const demoMembers = getDemoTeamMembers().map(m => ({
        id: m.id,
        user_id: m.id,
        role: m.role.toLowerCase().replace(/ /g, "_"),
        is_active: m.status === "active",
        joined_at: "2024-06-15",
        permissions: {},
        profiles: {
          full_name: m.name,
          avatar_url: null,
        },
      }));
      setTeamMembers(demoMembers);
      setInvitations([
        {
          id: "demo-invite-1",
          invitation_token: "demo-token-123",
          role: "field_worker",
          status: "active",
          current_uses: 0,
          max_uses: 1,
          expires_at: new Date(Date.now() + 604800000).toISOString(),
          created_at: new Date().toISOString(),
          invited_email: "newteam@example.com",
        },
      ]);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    if (user && !isDemoMode) {
      fetchTeamData();
    }
  }, [user, isDemoMode]);

  const fetchTeamData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('contractor_team_members')
        .select('*')
        .eq('contractor_id', user.id)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;
      setTeamMembers(members as any || []);

      // Fetch invitations
      const { data: invites, error: invitesError } = await supabase
        .from('contractor_team_invitations')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations(invites || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    setGeneratingInvite(true);
    try {
      // If email is provided, send email invitation
      if (inviteEmail) {
        const invitationToken = crypto.randomUUID();
        
        const { data: invitation, error: insertError } = await supabase
          .from("contractor_team_invitations")
          .insert({
            contractor_id: user?.id!,
            created_by: user?.id!,
            invited_email: inviteEmail.toLowerCase().trim(),
            role: selectedRole as any,
            invitation_token: invitationToken,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        toast({
          title: "Invitation Sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
      } else {
        // Generate shareable link invitation
        const { data, error } = await supabase.functions.invoke('generate-team-invitation', {
          body: { role: selectedRole, maxUses: 1 }
        });

        if (error) throw error;

        toast({
          title: "Invitation Created",
          description: "Copy the link below to share with your team member",
        });
      }

      fetchTeamData();
      setShowInviteDialog(false);
      setSelectedRole("");
      setInviteEmail("");
    } catch (error: any) {
      console.error('Error generating invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invitation",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/contractor/team/join?token=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: "Copied!",
      description: "Invitation link copied to clipboard",
    });
  };

  const handleToggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contractor_team_members')
        .update({ is_active: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Team member ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('contractor_team_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation revoked",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast({
        title: "Error",
        description: "Failed to revoke invitation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your team members and invite new collaborators
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="h-5 w-5" />
              Team Members ({teamMembers.length})
            </CardTitle>
            <CardDescription className="text-sm">
              Active members of your contractor team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No team members yet. Invite your first team member to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {member.profiles?.full_name || "Unnamed User"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={ROLE_COLORS[member.role] || ""}
                          >
                            {AVAILABLE_ROLES.find(r => r.value === member.role)?.label || member.role}
                          </Badge>
                          {!member.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 bg-background">
                        <DropdownMenuItem
                          onClick={() => handleToggleMemberStatus(member.id, member.is_active)}
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Mail className="h-5 w-5" />
              Team Invitations
            </CardTitle>
            <CardDescription className="text-sm">
              Manage pending and past invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No invitations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ROLE_COLORS[invite.role] || ""}
                        >
                          {AVAILABLE_ROLES.find(r => r.value === invite.role)?.label || invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {invite.invited_email || "Link-based"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invite.status === 'active' ? 'default' : 'secondary'}>
                          {invite.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(invite.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(invite.expires_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {invite.status === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(invite.invitation_token)}
                              >
                                {copiedToken === invite.invitation_token ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeInvitation(invite.id)}
                              >
                                Revoke
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

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Generate a shareable link to invite a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to generate a shareable link instead
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateInvite} disabled={generatingInvite || !selectedRole}>
                {generatingInvite ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContractorLayout>
  );
}
