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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserPlus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useDemoMode } from "@/hooks/demo/useDemoMode";
import { getDemoRoleUsers } from "@/utils/demoContractorData";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

interface UserRole {
  role: string;
}

interface UserWithRoles extends UserProfile {
  roles: string[];
}

// Contractor-specific roles they can assign
const CONTRACTOR_ROLES = [
  "estimator",
  "project_coordinator",
  "project_manager",
  "foreman",
  "subcontractor",
];

export default function ContractorRoleManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [isContractor, setIsContractor] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>("");

  useEffect(() => {
    if (isDemoMode) {
      setIsContractor(true);
      setUsers(getDemoRoleUsers());
      setLoading(false);
    } else {
      checkAuth();
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isContractor && !isDemoMode) {
      fetchUsers();
    }
  }, [isContractor, isDemoMode]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/contractor/auth");
        return;
      }

      // Check if user is contractor or admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const userRoles = roles?.map(r => r.role) || [];
      const hasAccess = userRoles.includes("contractor") || userRoles.includes("admin");

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsContractor(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/contractor/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data - use ID as placeholder for email since we can't access auth.users directly
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id).map(r => String(r.role)) || [];
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.id.substring(0, 8) + "...", // Show partial ID as placeholder
          roles: userRoles,
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) return;

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `Role "${selectedRole}" would be added to ${selectedUser.full_name || selectedUser.email}`,
      });
      setAddRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: selectedRole as any,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedRole} role added to ${selectedUser.full_name || selectedUser.email}`,
      });

      setAddRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string, userName: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `Role "${role}" would be removed from ${userName}`,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${role} role removed from ${userName}`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const handleBulkAddRole = async () => {
    if (selectedUsers.size === 0 || !bulkRole) return;

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `Role "${bulkRole}" would be added to ${selectedUsers.size} user(s)`,
      });
      setBulkRoleDialogOpen(false);
      setSelectedUsers(new Set());
      setBulkRole("");
      return;
    }

    try {
      const insertData = Array.from(selectedUsers).map(userId => ({
        user_id: userId,
        role: bulkRole as any,
      }));

      const { error } = await supabase
        .from("user_roles")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${bulkRole} role added to ${selectedUsers.size} user(s)`,
      });

      setBulkRoleDialogOpen(false);
      setSelectedUsers(new Set());
      setBulkRole("");
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding bulk roles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add roles",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "estimator") return "default";
    if (role === "project_manager") return "secondary";
    return "outline";
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
              <Shield className="h-8 w-8 text-primary" />
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign roles to team members
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage roles for estimators, project managers, coordinators, and more
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedUsers.size > 0 && (
                  <Button
                    onClick={() => setBulkRoleDialogOpen(true)}
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Role to {selectedUsers.size} Selected
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="gap-1"
                            >
                              {role}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveRole(user.id, role, user.full_name || user.email)}
                              />
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setAddRoleDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Role Dialog */}
        <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>
                Add a role to {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_ROLES.filter(
                    role => !selectedUser?.roles.includes(role)
                  ).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={!selectedRole}>
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Add Role Dialog */}
        <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role to Multiple Users</DialogTitle>
              <DialogDescription>
                Add a role to {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAddRole} disabled={!bulkRole}>
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContractorLayout>
  );
}