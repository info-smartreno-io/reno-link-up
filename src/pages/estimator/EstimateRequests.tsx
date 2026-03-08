import { useState } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Eye, CheckCircle2 } from "lucide-react";

export default function EstimateRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("assigned");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch assigned estimate requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["estimator-requests", statusFilter, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      let query = supabase
        .from("estimate_requests")
        .select("*")
        .eq("assigned_to", currentUser.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from("estimate_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimator-requests"] });
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const filteredRequests = requests?.filter((request: any) =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <EstimatorLayout>
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>My Estimate Requests</CardTitle>
          <CardDescription>
            View and manage estimate requests assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search requests..."
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
                  <TableHead>Address</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>Status</TableHead>
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
                      <TableCell>{request.address}</TableCell>
                      <TableCell>{request.project_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "assigned"
                              ? "default"
                              : request.status === "contacted"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Details</DialogTitle>
                                <DialogDescription>
                                  Full information about this estimate request
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <span className="font-semibold">Name:</span> {selectedRequest?.name}
                                </div>
                                <div>
                                  <span className="font-semibold">Email:</span> {selectedRequest?.email}
                                </div>
                                <div>
                                  <span className="font-semibold">Phone:</span> {selectedRequest?.phone}
                                </div>
                                <div>
                                  <span className="font-semibold">Address:</span> {selectedRequest?.address}
                                </div>
                                <div>
                                  <span className="font-semibold">Project Type:</span> {selectedRequest?.project_type}
                                </div>
                                <div>
                                  <span className="font-semibold">Message:</span>
                                  <p className="mt-1 text-sm">{selectedRequest?.message}</p>
                                </div>
                                <div className="pt-4">
                                  <label className="font-semibold block mb-2">Update Status:</label>
                                  <Select
                                    defaultValue={selectedRequest?.status}
                                    onValueChange={(status) =>
                                      updateStatus.mutate({ requestId: selectedRequest.id, status })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="assigned">Assigned</SelectItem>
                                      <SelectItem value="contacted">Contacted</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {request.status !== "completed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatus.mutate({ requestId: request.id, status: "completed" })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </EstimatorLayout>
  );
}
