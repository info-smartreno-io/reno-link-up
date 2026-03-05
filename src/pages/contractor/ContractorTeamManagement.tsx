import { useState, useEffect } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, XCircle, Edit2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useContractorRole } from "@/hooks/useContractorRole";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoTeamMembers } from "@/utils/demoContractorData";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
  email: string;
  full_name: string | null;
}

const CONTRACTOR_ROLES = [
  { value: 'contractor_admin', label: 'Contractor Admin' },
  { value: 'inside_sales', label: 'Inside Sales' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'project_coordinator', label: 'Project Coordinator' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'field_super', label: 'Field Supervisor' },
  { value: 'viewer', label: 'Viewer' },
];

export default function ContractorTeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: '',
    title: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { contractorUser, isContractorAdmin } = useContractorRole();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      const demoData = getDemoTeamMembers().map(m => ({
        id: m.id,
        user_id: m.id,
        role: m.role.toLowerCase().replace(/ /g, '_'),
        title: m.role,
        is_active: m.status === 'active',
        created_at: new Date().toISOString(),
        email: m.email,
        full_name: m.name,
      }));
      setTeamMembers(demoData);
      setLoading(false);
      return;
    }

    if (!contractorUser) return;
    
    if (!isContractorAdmin) {
      toast({
        title: "Access Denied",
        description: "Only contractor admins can manage team members",
        variant: "destructive",
      });
      navigate("/contractor/overview");
      return;
    }

    fetchTeamMembers();
  }, [contractorUser, isContractorAdmin, isDemoMode]);

  const fetchTeamMembers = async () => {
    if (!contractorUser) return;

    try {
      const { data: contractorUsers, error: cuError } = await supabase
        .from("contractor_users")
        .select("*")
        .eq("contractor_id", contractorUser.contractor_id)
        .order("created_at", { ascending: false });

      if (cuError) throw cuError;

      // Fetch user details from profiles and auth.users
      const membersWithDetails = await Promise.all(
        (contractorUsers || []).map(async (cu) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(cu.user_id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", cu.user_id)
            .single();

          return {
            ...cu,
            email: user?.email || '',
            full_name: profile?.full_name || null,
          };
        })
      );

      setTeamMembers(membersWithDetails as TeamMember[]);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!contractorUser || !inviteForm.email || !inviteForm.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteForm.email,
          role: inviteForm.role,
          title: inviteForm.title,
          contractorId: contractorUser.contractor_id,
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: '', title: '' });
      fetchTeamMembers();
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("contractor_users")
        .update({ 
          role: selectedMember.role,
          title: selectedMember.title,
        })
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "Team member role has been updated",
      });

      setEditDialogOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from("contractor_users")
        .update({ is_active: !member.is_active })
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: member.is_active ? "User Deactivated" : "User Activated",
        description: `Team member has been ${member.is_active ? 'deactivated' : 'activated'}`,
      });

      fetchTeamMembers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'contractor_admin': return 'default';
      case 'inside_sales': return 'secondary';
      case 'estimator': return 'outline';
      case 'project_coordinator': return 'secondary';
      case 'project_manager': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Manage your team members and their roles</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/contractor/user-applicants')}>
              View Applicants
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name || 'Not set'}
                  </TableCell>
                  <TableCell>{member.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role) as any}>
                      {CONTRACTOR_ROLES.find(r => r.value === member.role)?.label || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.title || '-'}</TableCell>
                  <TableCell>
                    {member.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(member)}
                      >
                        {member.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your contractor team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACTOR_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Estimator"
                  value={inviteForm.title}
                  onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member role and title
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    value={selectedMember.role} 
                    onValueChange={(value) => setSelectedMember({ ...selectedMember, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACTOR_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={selectedMember.title || ''}
                    onChange={(e) => setSelectedMember({ ...selectedMember, title: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContractorLayout>
  );
}
