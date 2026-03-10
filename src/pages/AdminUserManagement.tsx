import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Shield, UserPlus, UserMinus, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";
import { AdminSideNav } from "@/components/AdminSideNav";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

type AppRole = Database['public']['Enums']['app_role'];

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface UserWithRoles extends UserProfile {
  roles: AppRole[];
}

const AVAILABLE_ROLES: AppRole[] = [
  'admin',
  'estimator',
  'project_coordinator',
  'client_success_manager',
  'call_center_rep',
  'homeowner',
  'contractor',
  'architect',
  'interior_designer',
  'vendor'
];

/** User-facing label for role (estimator → Construction Agent; others use role with underscores as spaces). */
function getRoleDisplayLabel(role: AppRole): string {
  if (role === 'estimator') return 'Construction Agent';
  return role.replace(/_/g, ' ');
}

export default function AdminUserManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkSelectedRole, setBulkSelectedRole] = useState<AppRole | "">("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (error) throw error;

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
        await fetchUsers();
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch auth users to get emails
      const { data, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const authUsers = data?.users || [];

      // Combine the data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const authUser = authUsers.find(u => u.id === profile.id);
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role);

        return {
          ...profile,
          email: authUser?.email,
          roles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: selectedRole
        });

      if (error) throw error;

      toast({
        title: "Role Added",
        description: `Successfully added ${getRoleDisplayLabel(selectedRole)} role to ${selectedUser.full_name || selectedUser.email}.`,
      });

      await fetchUsers();
      setDialogOpen(false);
      setSelectedRole("");
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add role.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `Successfully removed ${getRoleDisplayLabel(role)} role.`,
      });

      await fetchUsers();
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove role.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAddRole = async () => {
    if (selectedUserIds.length === 0 || !bulkSelectedRole) return;

    setProcessing(true);
    try {
      const insertPromises = selectedUserIds.map(userId => 
        supabase.from('user_roles').insert({
          user_id: userId,
          role: bulkSelectedRole
        })
      );

      const results = await Promise.allSettled(insertPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      toast({
        title: "Bulk Role Assignment Complete",
        description: `Successfully added ${getRoleDisplayLabel(bulkSelectedRole)} role to ${successCount} user(s).${failCount > 0 ? ` ${failCount} failed.` : ''}`,
      });

      await fetchUsers();
      setBulkDialogOpen(false);
      setBulkSelectedRole("");
      setSelectedUserIds([]);
    } catch (error: any) {
      console.error("Error in bulk role assignment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign roles.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'estimator':
      case 'contractor':
        return 'default';
      case 'project_coordinator':
      case 'architect':
        return 'secondary';
      case 'client_success_manager':
      case 'homeowner':
        return 'outline';
      default:
        return 'default';
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
      <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
      
      <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Assign and manage staff roles
            </p>
          </div>
          {selectedUserIds.length > 0 && (
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Users className="h-4 w-4" />
                  Bulk Assign Role ({selectedUserIds.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Role Assignment</DialogTitle>
                  <DialogDescription>
                    Assign a role to {selectedUserIds.length} selected user(s)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Select
                    value={bulkSelectedRole}
                    onValueChange={(value) => setBulkSelectedRole(value as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleDisplayLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkAddRole}
                    disabled={!bulkSelectedRole || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Assign to {selectedUserIds.length} User(s)
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Manage role assignments for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUserIds.length === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(userProfile.id)}
                          onCheckedChange={() => toggleUserSelection(userProfile.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{userProfile.full_name || "No name"}</TableCell>
                      <TableCell>{userProfile.email || "No email"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          ) : (
                            userProfile.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant={getRoleBadgeVariant(role)}
                                className="gap-1"
                              >
                                {getRoleDisplayLabel(role)}
                                <button
                                  onClick={() => handleRemoveRole(userProfile.id, role)}
                                  disabled={processing}
                                  className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                                >
                                  <UserMinus className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={dialogOpen && selectedUser?.id === userProfile.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) {
                            setSelectedUser(userProfile);
                            setSelectedRole("");
                          } else {
                            setSelectedUser(null);
                            setSelectedRole("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setSelectedUser(userProfile)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Add Role
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Role</DialogTitle>
                              <DialogDescription>
                                Assign a new role to {userProfile.full_name || userProfile.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Select
                                value={selectedRole}
                                onValueChange={(value) => setSelectedRole(value as AppRole)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AVAILABLE_ROLES
                                    .filter(role => !userProfile.roles.includes(role))
                                    .map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {getRoleDisplayLabel(role)}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={handleAddRole}
                                disabled={!selectedRole || processing}
                                className="w-full"
                              >
                                {processing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Add Role
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
