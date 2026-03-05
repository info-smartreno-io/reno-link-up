import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { InviteSubcontractorsDialog } from "./InviteSubcontractorsDialog";
import { ScopePackageBuilder } from "./ScopePackageBuilder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Award, 
  Loader2, 
  MoreVertical,
  FileText,
  UserPlus,
  Calendar,
  Eye,
} from "lucide-react";

interface SubBiddingHubProps {
  projectId: string;
  isReadOnly?: boolean;
}

const TRADES = [
  "Exterior",
  "Mechanicals",
  "Interior",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Framing",
  "Roofing",
  "Flooring",
  "Painting",
  "Drywall",
  "Masonry",
  "Landscaping",
  "Demolition",
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    not_sent: { label: "Not Sent", className: "bg-muted text-muted-foreground", icon: XCircle },
    sent: { label: "Sent", className: "bg-blue-500/20 text-blue-700", icon: Send },
    bids_received: { label: "Bids In", className: "bg-amber-500/20 text-amber-700", icon: Clock },
    awarded: { label: "Awarded", className: "bg-green-500/20 text-green-700", icon: CheckCircle2 },
  };
  const c = config[status] || config.not_sent;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${c.className}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}

export function SubBiddingHub({ projectId, isReadOnly = false }: SubBiddingHubProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTrade, setNewTrade] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [viewBidsDialogOpen, setViewBidsDialogOpen] = useState(false);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["sub-bid-packages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_bid_packages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch invitations count per package
  const { data: inviteCounts = {} } = useQuery({
    queryKey: ["sub-invite-counts", projectId],
    queryFn: async () => {
      const packageIds = packages.map(p => p.id);
      if (packageIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("sub_bid_invitations")
        .select("package_id, status")
        .in("package_id", packageIds);

      if (error) throw error;
      
      const counts: Record<string, { total: number; viewed: number }> = {};
      (data || []).forEach(inv => {
        if (!counts[inv.package_id]) {
          counts[inv.package_id] = { total: 0, viewed: 0 };
        }
        counts[inv.package_id].total++;
        if (inv.status === "viewed" || inv.status === "bid_submitted") {
          counts[inv.package_id].viewed++;
        }
      });
      return counts;
    },
    enabled: packages.length > 0,
  });

  // Fetch bid responses per package
  const { data: bidResponses = [] } = useQuery({
    queryKey: ["sub-bid-responses", selectedPackage?.id],
    queryFn: async () => {
      if (!selectedPackage) return [];
      
      const { data, error } = await supabase
        .from("sub_bid_responses")
        .select("*")
        .eq("package_id", selectedPackage.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPackage && viewBidsDialogOpen,
  });

  const addPackageMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("sub_bid_packages").insert({
        project_id: projectId,
        trade: newTrade,
        budget_amount: parseFloat(newBudget) || null,
        status: "not_sent",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-packages", projectId] });
      toast({ title: "Bid package added" });
      setDialogOpen(false);
      setNewTrade("");
      setNewBudget("");
    },
    onError: () => {
      toast({ title: "Failed to add package", variant: "destructive" });
    },
  });

  const sendPackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("sub_bid_packages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_by: user.user?.id,
        })
        .eq("id", packageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-packages", projectId] });
      toast({ title: "Bid package sent to subcontractors" });
    },
  });

  const awardPackageMutation = useMutation({
    mutationFn: async ({ packageId, bidId, amount }: { packageId: string; bidId: string; amount: number }) => {
      // Update the package status
      const { error: pkgError } = await supabase
        .from("sub_bid_packages")
        .update({
          status: "awarded",
          awarded_amount: amount,
          awarded_at: new Date().toISOString(),
        })
        .eq("id", packageId);

      if (pkgError) throw pkgError;

      // Mark the bid as awarded
      const { error: bidError } = await supabase
        .from("sub_bid_responses")
        .update({
          is_awarded: true,
          awarded_at: new Date().toISOString(),
        })
        .eq("id", bidId);

      if (bidError) throw bidError;

      // Get the subcontractor ID from the bid
      const { data: bidData } = await supabase
        .from("sub_bid_responses")
        .select("subcontractor_id")
        .eq("id", bidId)
        .single();

      if (bidData) {
        // Create notification for the subcontractor
        await supabase.from("subcontractor_notifications").insert({
          subcontractor_id: bidData.subcontractor_id,
          type: "award",
          title: "Bid Awarded!",
          message: `Congratulations! Your bid of $${amount.toLocaleString()} has been accepted.`,
          link: `/contractor/subcontractor-portal?tab=projects`,
          is_read: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-packages", projectId] });
      queryClient.invalidateQueries({ queryKey: ["sub-bid-responses"] });
      toast({ title: "Bid awarded successfully" });
      setViewBidsDialogOpen(false);
    },
  });

  const openInviteDialog = (pkg: any) => {
    setSelectedPackage(pkg);
    setInviteDialogOpen(true);
  };

  const openScopeDialog = (pkg: any) => {
    setSelectedPackage(pkg);
    setScopeDialogOpen(true);
  };

  const openViewBidsDialog = (pkg: any) => {
    setSelectedPackage(pkg);
    setViewBidsDialogOpen(true);
  };

  const totalBudget = packages.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const totalAwarded = packages.reduce((sum, p) => sum + (p.awarded_amount || 0), 0);
  const awardedCount = packages.filter(p => p.status === "awarded").length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subcontractor Bidding</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subcontractor Bidding</CardTitle>
              <CardDescription>
                Manage bid packages, invitations, and awards
              </CardDescription>
            </div>
            {!isReadOnly && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Trade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Bid Package</DialogTitle>
                    <DialogDescription>
                      Create a new bid package for a trade
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Trade *</Label>
                      <select
                        value={newTrade}
                        onChange={(e) => setNewTrade(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="">Select trade...</option>
                        {TRADES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Amount</Label>
                      <Input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <Button 
                      onClick={() => addPackageMutation.mutate()} 
                      disabled={!newTrade || addPackageMutation.isPending}
                      className="w-full"
                    >
                      {addPackageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : "Add Package"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex gap-4 mt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Budget:</span>{" "}
              <span className="font-medium">${totalBudget.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Awarded:</span>{" "}
              <span className="font-medium">${totalAwarded.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>{" "}
              <span className="font-medium">{awardedCount}/{packages.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bid packages created yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Invites</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Awarded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => {
                  const inviteCount = inviteCounts[pkg.id] || { total: 0, viewed: 0 };
                  const hasScope = !!pkg.scope_description;
                  
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.trade}</TableCell>
                      <TableCell>
                        <StatusBadge status={pkg.status} />
                      </TableCell>
                      <TableCell>
                        {hasScope ? (
                          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700">
                            <FileText className="h-3 w-3" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            Not Set
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {inviteCount.viewed}/{inviteCount.total}
                        </span>
                      </TableCell>
                      <TableCell>{pkg.bid_count || 0}</TableCell>
                      <TableCell>
                        {pkg.budget_amount ? `$${pkg.budget_amount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        {pkg.awarded_amount ? (
                          <span className={pkg.awarded_amount > (pkg.budget_amount || 0) ? "text-destructive" : "text-green-600"}>
                            ${pkg.awarded_amount.toLocaleString()}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isReadOnly && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openScopeDialog(pkg)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Edit Scope
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openInviteDialog(pkg)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite Subs
                              </DropdownMenuItem>
                              {pkg.status === "not_sent" && hasScope && inviteCount.total > 0 && (
                                <DropdownMenuItem 
                                  onClick={() => sendPackageMutation.mutate(pkg.id)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Package
                                </DropdownMenuItem>
                              )}
                              {(pkg.bid_count || 0) > 0 && (
                                <DropdownMenuItem onClick={() => openViewBidsDialog(pkg)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Bids ({pkg.bid_count})
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Subcontractors Dialog */}
      {selectedPackage && (
        <InviteSubcontractorsDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          packageId={selectedPackage.id}
          trade={selectedPackage.trade}
          onInvitesSent={() => {
            queryClient.invalidateQueries({ queryKey: ["sub-invite-counts", projectId] });
          }}
        />
      )}

      {/* Scope Package Builder Dialog */}
      {selectedPackage && (
        <ScopePackageBuilder
          open={scopeDialogOpen}
          onOpenChange={setScopeDialogOpen}
          packageId={selectedPackage.id}
          trade={selectedPackage.trade}
          projectId={projectId}
          existingScope={{
            scope_description: selectedPackage.scope_description,
            scope_photos: selectedPackage.scope_photos,
            blueprints: selectedPackage.blueprints,
            scope_documents: selectedPackage.scope_documents,
            notes_for_subs: selectedPackage.notes_for_subs,
            project_address: selectedPackage.project_address,
            due_date: selectedPackage.due_date,
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["sub-bid-packages", projectId] });
          }}
        />
      )}

      {/* View Bids Dialog */}
      <Dialog open={viewBidsDialogOpen} onOpenChange={setViewBidsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bids for {selectedPackage?.trade}</DialogTitle>
            <DialogDescription>
              Review and award submitted bids
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bidResponses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bids received yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidResponses.map((bid: any) => (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium">
                        {bid.subcontractor_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>${bid.bid_amount?.toLocaleString()}</TableCell>
                      <TableCell>{bid.timeline_weeks} weeks</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {bid.notes || "—"}
                      </TableCell>
                      <TableCell>
                        {!bid.is_awarded && selectedPackage?.status !== "awarded" && (
                          <Button
                            size="sm"
                            onClick={() => awardPackageMutation.mutate({
                              packageId: selectedPackage.id,
                              bidId: bid.id,
                              amount: bid.bid_amount,
                            })}
                            disabled={awardPackageMutation.isPending}
                          >
                            <Award className="h-3 w-3 mr-1" />
                            Award
                          </Button>
                        )}
                        {bid.is_awarded && (
                          <Badge className="bg-green-500">Awarded</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
