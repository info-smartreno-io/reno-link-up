import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminEstimateRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch all estimate requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-estimate-requests", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("estimate_requests")
        .select("*, assigned_to(id, full_name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch estimators for assignment
  const { data: estimators } = useQuery({
    queryKey: ["estimators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name)")
        .eq("role", "estimator");

      if (error) throw error;
      return data?.map((r: any) => r.profiles).filter(Boolean) || [];
    },
  });

  // Assign estimator mutation
  const assignEstimator = useMutation({
    mutationFn: async ({ requestId, estimatorId, request }: { requestId: string; estimatorId: string; request: any }) => {
      const { error } = await supabase
        .from("estimate_requests")
        .update({
          assigned_to: estimatorId,
          assigned_at: new Date().toISOString(),
          status: "assigned",
        })
        .eq("id", requestId);

      if (error) throw error;

      // Send SMS notification to the estimator
      await supabase.functions.invoke("send-estimator-assignment-sms", {
        body: {
          estimatorId,
          requestId,
          homeownerName: request.name,
          projectType: request.project_type,
          address: request.address,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-estimate-requests"] });
      toast.success("Estimator assigned and notified via SMS");
    },
    onError: (error) => {
      toast.error("Failed to assign estimator: " + error.message);
    },
  });

  const filteredRequests = requests?.filter((request: any) =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Estimate Requests</CardTitle>
          <CardDescription>
            View and assign incoming estimate requests to estimators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests?.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.email}</div>
                          <div className="text-muted-foreground">{request.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.project_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "assigned"
                              ? "default"
                              : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.assigned_to?.full_name || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(estimatorId) =>
                            assignEstimator.mutate({ requestId: request.id, estimatorId, request })
                          }
                        >
                          <SelectTrigger className="w-36">
                            <UserPlus className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {estimators?.map((estimator: any) => (
                              <SelectItem key={estimator.id} value={estimator.id}>
                                {estimator.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
