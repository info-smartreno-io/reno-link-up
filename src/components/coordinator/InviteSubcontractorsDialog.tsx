import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, Send, UserPlus, Loader2, Building, Mail } from "lucide-react";

interface InviteSubcontractorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  trade: string;
  onInvitesSent?: () => void;
}

interface Subcontractor {
  id: string;
  user_id: string;
  company_name: string;
  trade: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  rating?: number;
}

export function InviteSubcontractorsDialog({
  open,
  onOpenChange,
  packageId,
  trade,
  onInvitesSent,
}: InviteSubcontractorsDialogProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubName, setNewSubName] = useState("");

  // Fetch subcontractors matching the trade
  const { data: subcontractors = [], isLoading } = useQuery({
    queryKey: ["subcontractors-for-invite", trade],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcontractors" as any)
        .select("*")
        .ilike("trade", `%${trade}%`)
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return (data || []) as unknown as Subcontractor[];
    },
    enabled: open,
  });

  // Fetch already invited subcontractors for this package
  const { data: existingInvites = [] } = useQuery({
    queryKey: ["existing-invites", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_bid_invitations")
        .select("subcontractor_id")
        .eq("package_id", packageId);

      if (error) throw error;
      return (data || []).map((i) => i.subcontractor_id);
    },
    enabled: open && !!packageId,
  });

  const sendInvitesMutation = useMutation({
    mutationFn: async (subcontractorIds: string[]) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Create invitation records
      const invitations = subcontractorIds.map((subId) => ({
        package_id: packageId,
        subcontractor_id: subId,
        status: "pending",
        invitation_token: crypto.randomUUID(),
      }));

      const { error } = await supabase
        .from("sub_bid_invitations")
        .insert(invitations);

      if (error) throw error;

      // Create notifications for each subcontractor
      const notifications = subcontractorIds.map((subId) => ({
        subcontractor_id: subId,
        type: "bid_request" as const,
        title: `New Bid Request: ${trade}`,
        message: `You've been invited to submit a bid for ${trade} work.`,
        link: `/contractor/subcontractor-portal?tab=opportunities`,
        is_read: false,
      }));

      await supabase.from("subcontractor_notifications").insert(notifications);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["existing-invites", packageId] });
      toast.success(`Invitations sent to ${selectedSubs.length} subcontractor(s)`);
      setSelectedSubs([]);
      onInvitesSent?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send invitations");
    },
  });

  const inviteNewSubMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      // For new subs, we'd typically send an email invitation
      // For now, just show a success message
      toast.info(`Invitation would be sent to ${email}`);
    },
    onSuccess: () => {
      setNewSubEmail("");
      setNewSubName("");
    },
  });

  const filteredSubs = subcontractors.filter((sub) => {
    const matchesSearch =
      sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadyInvited = !existingInvites.includes(sub.user_id);
    return matchesSearch && notAlreadyInvited;
  });

  const toggleSubcontractor = (userId: string) => {
    setSelectedSubs((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvites = () => {
    if (selectedSubs.length === 0) {
      toast.error("Please select at least one subcontractor");
      return;
    }
    sendInvitesMutation.mutate(selectedSubs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Subcontractors
          </DialogTitle>
          <DialogDescription>
            Select subcontractors to invite for {trade} bid package
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subcontractors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          {selectedSubs.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
              <span className="text-sm">
                {selectedSubs.length} subcontractor(s) selected
              </span>
              <Button
                size="sm"
                onClick={handleSendInvites}
                disabled={sendInvitesMutation.isPending}
              >
                {sendInvitesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Invites
              </Button>
            </div>
          )}

          {/* Subcontractor list */}
          <ScrollArea className="h-[300px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Building className="h-8 w-8 mb-2" />
                <p>No subcontractors found for {trade}</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubs.includes(sub.user_id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSubcontractor(sub.user_id)}
                  >
                    <Checkbox
                      checked={selectedSubs.includes(sub.user_id)}
                      onCheckedChange={() => toggleSubcontractor(sub.user_id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{sub.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.contact_name || "No contact name"}
                      </p>
                    </div>
                    <Badge variant="outline">{sub.trade}</Badge>
                    {sub.rating && (
                      <Badge variant="secondary">★ {sub.rating}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Invite new subcontractor */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invite New Subcontractor
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="newSubName">Company Name</Label>
                <Input
                  id="newSubName"
                  placeholder="Company name"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newSubEmail">Email</Label>
                <Input
                  id="newSubEmail"
                  type="email"
                  placeholder="email@company.com"
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!newSubEmail || !newSubName}
              onClick={() =>
                inviteNewSubMutation.mutate({
                  email: newSubEmail,
                  name: newSubName,
                })
              }
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email Invitation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
