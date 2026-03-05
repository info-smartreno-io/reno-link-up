import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  X
} from "lucide-react";
import { format } from "date-fns";

interface Blocker {
  id: string;
  lead_id: string;
  blocker_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const BLOCKER_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  architectural: { 
    label: "Needs Architectural", 
    icon: Building2, 
    color: "text-purple-500",
    description: "This project requires architectural plans before proceeding"
  },
  financing: { 
    label: "Needs Financing", 
    icon: DollarSign, 
    color: "text-amber-500",
    description: "Client needs financing approval before proceeding"
  },
  permit: { 
    label: "Permit Issue", 
    icon: AlertTriangle, 
    color: "text-red-500",
    description: "There is a permit-related issue blocking progress"
  },
  other: { 
    label: "Other Blocker", 
    icon: AlertTriangle, 
    color: "text-gray-500",
    description: "Other issue blocking progress"
  },
};

interface Props {
  leadId: string;
  isReadonly?: boolean;
}

export function BlockersPanel({ leadId, isReadonly = false }: Props) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [resolveBlockerId, setResolveBlockerId] = useState<string | null>(null);

  const { data: blockers = [], isLoading } = useQuery({
    queryKey: ["blockers", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blockers')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Blocker[];
    },
  });

  const addBlockerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) throw new Error("No blocker type selected");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create blocker
      const { error: blockerError } = await supabase
        .from('blockers')
        .insert({
          lead_id: leadId,
          blocker_type: selectedType,
          notes,
          created_by: user.id,
        });

      if (blockerError) throw blockerError;

      // Update lead's blocker_type
      const { error: leadError } = await supabase
        .from('leads')
        .update({ blocker_type: selectedType })
        .eq('id', leadId);

      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockers", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      setShowAddDialog(false);
      setSelectedType(null);
      setNotes("");
      toast.success("Blocker flagged - automation triggered");
    },
    onError: (error) => {
      toast.error("Failed to add blocker");
      console.error(error);
    },
  });

  const resolveBlockerMutation = useMutation({
    mutationFn: async (blockerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Resolve blocker
      const { error: blockerError } = await supabase
        .from('blockers')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('id', blockerId);

      if (blockerError) throw blockerError;

      // Check if there are other active blockers
      const { data: activeBlockers } = await supabase
        .from('blockers')
        .select('blocker_type')
        .eq('lead_id', leadId)
        .eq('status', 'active')
        .neq('id', blockerId)
        .limit(1);

      // Update lead's blocker_type
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          blocker_type: activeBlockers && activeBlockers.length > 0 
            ? activeBlockers[0].blocker_type 
            : null 
        })
        .eq('id', leadId);

      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockers", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      setResolveBlockerId(null);
      toast.success("Blocker resolved");
    },
    onError: (error) => {
      toast.error("Failed to resolve blocker");
      console.error(error);
    },
  });

  const activeBlockers = blockers.filter(b => b.status === 'active');
  const resolvedBlockers = blockers.filter(b => b.status === 'resolved');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Blockers & Escalations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick action buttons */}
          {!isReadonly && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950"
                onClick={() => {
                  setSelectedType('architectural');
                  setShowAddDialog(true);
                }}
              >
                <Building2 className="h-4 w-4 mr-1.5 text-purple-500" />
                Flag Needs Architectural
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
                onClick={() => {
                  setSelectedType('financing');
                  setShowAddDialog(true);
                }}
              >
                <DollarSign className="h-4 w-4 mr-1.5 text-amber-500" />
                Flag Needs Financing
              </Button>
            </div>
          )}

          {/* Active blockers */}
          {activeBlockers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Active Blockers</h4>
              {activeBlockers.map((blocker) => {
                const config = BLOCKER_CONFIG[blocker.blocker_type] || BLOCKER_CONFIG.other;
                const Icon = config.icon;

                return (
                  <div
                    key={blocker.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-destructive/30 bg-destructive/5"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="destructive" className="text-[10px]">Active</Badge>
                      </div>
                      {blocker.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{blocker.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Flagged {format(new Date(blocker.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {!isReadonly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setResolveBlockerId(blocker.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolved blockers */}
          {resolvedBlockers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Resolved</h4>
              {resolvedBlockers.slice(0, 3).map((blocker) => {
                const config = BLOCKER_CONFIG[blocker.blocker_type] || BLOCKER_CONFIG.other;
                const Icon = config.icon;

                return (
                  <div
                    key={blocker.id}
                    className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground line-through">
                      {config.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Resolved</Badge>
                  </div>
                );
              })}
            </div>
          )}

          {blockers.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No blockers flagged
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Blocker Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedType && BLOCKER_CONFIG[selectedType]?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedType && BLOCKER_CONFIG[selectedType]?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="blocker-notes">Notes</Label>
              <Textarea
                id="blocker-notes"
                placeholder="Add details about this blocker..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 inline-block mr-1.5" />
              This will trigger an automated notification to the relevant team.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addBlockerMutation.mutate()}
              disabled={addBlockerMutation.isPending}
            >
              Flag Blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Confirmation */}
      <AlertDialog open={!!resolveBlockerId} onOpenChange={() => setResolveBlockerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Blocker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the blocker as resolved and update the lead status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveBlockerId && resolveBlockerMutation.mutate(resolveBlockerId)}
            >
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}