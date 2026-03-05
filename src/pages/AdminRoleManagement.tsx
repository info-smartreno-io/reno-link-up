import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, X, Search, User, Users2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", color: "destructive" },
  { value: "contractor", label: "Contractor", color: "default" },
  { value: "estimator", label: "Estimator", color: "secondary" },
  { value: "foreman", label: "Foreman", color: "outline" },
  { value: "subcontractor", label: "Subcontractor", color: "outline" },
  { value: "project_manager", label: "Project Manager", color: "default" },
  { value: "architect", label: "Architect", color: "secondary" },
  { value: "interior_designer", label: "Interior Designer", color: "secondary" },
  { value: "vendor", label: "Vendor", color: "outline" },
  { value: "homeowner", label: "Homeowner", color: "outline" },
  { value: "sales", label: "Sales", color: "default" },
  { value: "inside_sales", label: "Inside Sales", color: "default" },
  { value: "outside_sales", label: "Outside Sales", color: "default" },
] as const;

export default function AdminRoleManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all user roles grouped by user
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get unique user IDs
      const userIds = [...new Set(userRoles?.map((ur) => ur.user_id) || [])];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      if (profilesError) throw profilesError;

      // If no user IDs from roles, fetch all profiles to show users without roles
      if (userIds.length === 0) {
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .limit(100);

        if (allProfilesError) throw allProfilesError;

        const usersWithRoles: UserProfile[] = (allProfiles || []).map((profile) => ({
          id: profile.id,
          email: "", // Will be hidden or fetched separately
          full_name: profile.full_name || "No name",
          roles: [],
        }));

        setUsers(usersWithRoles);
        return;
      }

      // Combine profiles with their roles
      const usersWithRoles: UserProfile[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: "", // Email not available in profiles table
        full_name: profile.full_name || "No name",
        roles: userRoles
          ?.filter((ur) => ur.user_id === profile.id)
          .map((ur) => ur.role as string) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: selectedUser, role: selectedRole as any }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      setDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
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

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
    return roleConfig?.color || "default";
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
    return roleConfig?.label || role;
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
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
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkRole || selectedUsers.size === 0) return;

    try {
      const insertPromises = Array.from(selectedUsers).map((userId) =>
        supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: bulkRole as any }])
      );

      const results = await Promise.allSettled(insertPromises);
      
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      if (successCount > 0) {
        toast({
          title: "Bulk Assignment Complete",
          description: `Successfully assigned ${bulkRole} role to ${successCount} user(s)${
            failCount > 0 ? `. ${failCount} assignment(s) failed (users may already have this role).` : ""
          }`,
        });
      }

      setBulkDialogOpen(false);
      setBulkRole("");
      setSelectedUsers(new Set());
      setConfirmDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error in bulk assignment:", error);
      toast({
        title: "Error",
        description: "Failed to complete bulk assignment",
        variant: "destructive",
      });
    }
  };

  const openBulkDialog = () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user",
        variant: "destructive",
      });
      return;
    }
    setBulkDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and access permissions
            </p>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>
              Assign and manage roles for all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={openBulkDialog}
                  disabled={selectedUsers.size === 0}
                  variant="outline"
                >
                  <Users2 className="h-4 w-4 mr-2" />
                  Bulk Assign ({selectedUsers.size})
                </Button>
              </div>

              {selectedUsers.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium">
                    {selectedUsers.size} user(s) selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : (
              <div className="rounded-md border mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.size === filteredUsers.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all users"
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                              aria-label={`Select ${user.full_name || user.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">
                                {user.full_name || "No name"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.full_name ? (
                              <span className="text-sm text-muted-foreground">
                                ID: {user.id.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {user.id.slice(0, 8)}...
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {user.roles.length === 0 ? (
                                <Badge variant="outline">No roles</Badge>
                              ) : (
                                user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant={getRoleBadgeVariant(role) as any}
                                    className="flex items-center gap-1"
                                  >
                                    {getRoleLabel(role)}
                                    <button
                                      onClick={() => removeRole(user.id, role)}
                                      className="ml-1 hover:text-destructive transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog
                              open={dialogOpen && selectedUser === user.id}
                              onOpenChange={(open) => {
                                setDialogOpen(open);
                                if (open) {
                                  setSelectedUser(user.id);
                                } else {
                                  setSelectedUser(null);
                                  setSelectedRole("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Role
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Role</DialogTitle>
                                  <DialogDescription>
                                    Add a new role to {user.full_name || user.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Select Role</Label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a role..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {AVAILABLE_ROLES.filter(
                                          (role) => !user.roles.includes(role.value)
                                        ).map((role) => (
                                          <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setDialogOpen(false);
                                      setSelectedUser(null);
                                      setSelectedRole("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={addRole} disabled={!selectedRole}>
                                    Assign Role
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Overview of role capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role.value} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant={role.color as any} className="mt-0.5">
                    {role.label}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {role.value === "admin" && "Full system access and user management"}
                    {role.value === "contractor" && "Project management and bidding"}
                    {role.value === "estimator" && "Create and manage estimates"}
                    {role.value === "project_manager" && "Oversee project execution"}
                    {role.value === "sales" && "Access to sales and CRM features"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Assignment Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Role Assignment</DialogTitle>
              <DialogDescription>
                Assign a role to {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={bulkRole} onValueChange={setBulkRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant={role.color as any}>{role.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will assign the selected role to all {selectedUsers.size} user(s).
                  Users who already have this role will be skipped.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkDialogOpen(false);
                  setBulkRole("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setBulkDialogOpen(false);
                  setConfirmDialogOpen(true);
                }}
                disabled={!bulkRole}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to assign the <strong>{getRoleLabel(bulkRole)}</strong> role to{" "}
                <strong>{selectedUsers.size}</strong> user(s).
                <br />
                <br />
                This action cannot be undone automatically. You will need to manually remove
                roles if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkRole("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkAssign}>
                Assign Roles
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
