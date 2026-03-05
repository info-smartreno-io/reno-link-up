import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Mail, Phone, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { CreateResourceDialog } from "@/components/scheduling/CreateResourceDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Resource {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  hourly_rate?: number | null;
  user_id?: string | null;
}

export default function AdminResources() {
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["schedule_resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: Partial<Resource>) => {
      const { data, error } = await supabase
        .from("schedule_resources")
        .insert({
          name: resourceData.name!,
          role: resourceData.role!,
          email: resourceData.email || null,
          phone: resourceData.phone || null,
          hourly_rate: resourceData.hourly_rate || null,
          user_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_resources"] });
      toast.success("Resource created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create resource: " + error.message);
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...resourceData }: Partial<Resource> & { id: string }) => {
      const { data, error } = await supabase
        .from("schedule_resources")
        .update({
          name: resourceData.name,
          role: resourceData.role,
          email: resourceData.email || null,
          phone: resourceData.phone || null,
          hourly_rate: resourceData.hourly_rate || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_resources"] });
      toast.success("Resource updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update resource: " + error.message);
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schedule_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_resources"] });
      toast.success("Resource deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });

  const handleSaveResource = (data: any) => {
    const resourceData = {
      name: data.name,
      role: data.type,
      email: data.email || null,
      phone: data.phone || null,
      hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
    };

    if (data.id) {
      updateResourceMutation.mutate({ id: data.id, ...resourceData });
    } else {
      createResourceMutation.mutate(resourceData);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setResourceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (resourceToDelete) {
      deleteResourceMutation.mutate(resourceToDelete);
      setResourceToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getTypeLabel = (role: string) => {
    switch (role) {
      case "team_member":
        return "Team Member";
      case "contractor":
        return "Contractor";
      case "subcontractor":
        return "Subcontractor";
      default:
        return role;
    }
  };

  const getTypeBadgeVariant = (role: string) => {
    switch (role) {
      case "team_member":
        return "default";
      case "contractor":
        return "secondary";
      case "subcontractor":
        return "outline";
      default:
        return "default";
    }
  };

  const resourcesByType = {
    team_member: resources.filter((r) => r.role === "team_member"),
    contractor: resources.filter((r) => r.role === "contractor"),
    subcontractor: resources.filter((r) => r.role === "subcontractor"),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members, contractors, and subcontractors for project assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingResource(null);
            setResourceDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesByType.team_member.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesByType.contractor.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subcontractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesByType.subcontractor.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Resources</CardTitle>
          <CardDescription>
            View and manage all project resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resources found. Create your first resource to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(resource.role)}>
                        {getTypeLabel(resource.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {resource.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {resource.email}
                          </div>
                        )}
                        {resource.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {resource.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.hourly_rate ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {resource.hourly_rate.toFixed(2)}/hr
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditResource(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateResourceDialog
        open={resourceDialogOpen}
        onOpenChange={(open) => {
          setResourceDialogOpen(open);
          if (!open) setEditingResource(null);
        }}
        editResource={editingResource}
        onSave={handleSaveResource}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
              Any task assignments for this resource will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResourceToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
