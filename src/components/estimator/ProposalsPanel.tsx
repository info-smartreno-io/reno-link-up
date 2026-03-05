import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Send, 
  Phone, 
  FileEdit, 
  Eye, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface Proposal {
  id: string;
  lead_id: string;
  amount: number | null;
  status: string;
  current_version: number;
  sent_at: string | null;
  viewed_at: string | null;
  created_at: string;
}

interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  notes: string | null;
  revision_reason: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: "Draft", icon: FileEdit, color: "bg-gray-500" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-500" },
  viewed: { label: "Viewed", icon: Eye, color: "bg-amber-500" },
  accepted: { label: "Accepted", icon: CheckCircle2, color: "bg-green-500" },
  declined: { label: "Declined", icon: XCircle, color: "bg-red-500" },
  revision_requested: { label: "Revision Requested", icon: AlertTriangle, color: "bg-orange-500" },
};

interface Props {
  leadId: string;
  isReadonly?: boolean;
}

export function ProposalsPanel({ leadId, isReadonly = false }: Props) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [revisionReason, setRevisionReason] = useState("");

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Proposal[];
    },
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["proposal-versions", selectedProposal?.id],
    enabled: !!selectedProposal,
    queryFn: async () => {
      if (!selectedProposal) return [];
      const { data, error } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('proposal_id', selectedProposal.id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as ProposalVersion[];
    },
  });

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          lead_id: leadId,
          estimator_id: user.id,
          amount: amount ? parseFloat(amount) : null,
          status: 'draft',
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Create initial version
      const { error: versionError } = await supabase
        .from('proposal_versions')
        .insert({
          proposal_id: proposal.id,
          version_number: 1,
          notes,
          created_by: user.id,
        });

      if (versionError) throw versionError;

      return proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", leadId] });
      setShowCreateDialog(false);
      setAmount("");
      setNotes("");
      toast.success("Proposal created");
    },
    onError: (error) => {
      toast.error("Failed to create proposal");
      console.error(error);
    },
  });

  const createRevisionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProposal) throw new Error("No proposal selected");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newVersion = selectedProposal.current_version + 1;

      // Create new version
      const { error: versionError } = await supabase
        .from('proposal_versions')
        .insert({
          proposal_id: selectedProposal.id,
          version_number: newVersion,
          notes,
          revision_reason: revisionReason,
          created_by: user.id,
        });

      if (versionError) throw versionError;

      // Update proposal
      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          current_version: newVersion,
          amount: amount ? parseFloat(amount) : selectedProposal.amount,
          status: 'draft',
        })
        .eq('id', selectedProposal.id);

      if (proposalError) throw proposalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", leadId] });
      queryClient.invalidateQueries({ queryKey: ["proposal-versions", selectedProposal?.id] });
      setShowRevisionDialog(false);
      setSelectedProposal(null);
      setAmount("");
      setNotes("");
      setRevisionReason("");
      toast.success("Revision created");
    },
    onError: (error) => {
      toast.error("Failed to create revision");
      console.error(error);
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('proposals')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", leadId] });
      toast.success("Proposal sent");
    },
    onError: (error) => {
      toast.error("Failed to send proposal");
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposals & Revisions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Proposals & Revisions</CardTitle>
          {!isReadonly && (
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Proposal
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No proposals yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => {
                    const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">V{proposal.current_version}</TableCell>
                        <TableCell>
                          {proposal.amount 
                            ? `$${proposal.amount.toLocaleString()}` 
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {proposal.sent_at 
                            ? format(new Date(proposal.sent_at), "M/d/yy") 
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!isReadonly && proposal.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendProposalMutation.mutate(proposal.id)}
                                disabled={sendProposalMutation.isPending}
                              >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                Send
                              </Button>
                            )}
                            {!isReadonly && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setAmount(proposal.amount?.toString() || "");
                                  setShowRevisionDialog(true);
                                }}
                              >
                                <FileEdit className="h-3.5 w-3.5 mr-1" />
                                Revise
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Proposal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this proposal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createProposalMutation.mutate()}
              disabled={createProposalMutation.isPending}
            >
              Create Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="revision-amount">Updated Amount</Label>
              <Input
                id="revision-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="revision-reason">Revision Reason</Label>
              <Textarea
                id="revision-reason"
                placeholder="Why is this revision needed?"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="revision-notes">Notes</Label>
              <Textarea
                id="revision-notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createRevisionMutation.mutate()}
              disabled={createRevisionMutation.isPending || !revisionReason}
            >
              Create Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}