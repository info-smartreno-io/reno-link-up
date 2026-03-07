import { useState } from "react";
import { useProjectSubcontractorBids } from "@/hooks/contractor/useProjectSubcontractorBids";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2, Copy, ExternalLink, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const TRADES = [
  "Electrical", "Plumbing", "HVAC", "Framing", "Drywall", "Painting",
  "Flooring", "Roofing", "Masonry", "Demolition", "Excavation", "Landscaping",
  "Insulation", "Windows & Doors", "Cabinets", "Tile", "Concrete", "General Labor"
];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  invited: "outline",
  submitted: "default",
  awarded: "default",
  rejected: "destructive",
};

interface ProjectSubcontractorsProps {
  projectId: string;
}

export function ProjectSubcontractors({ projectId }: ProjectSubcontractorsProps) {
  const { data: bids, isLoading, addBid, updateBid } = useProjectSubcontractorBids(projectId);
  const [open, setOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardBid, setAwardBid] = useState<any>(null);
  const [awardForm, setAwardForm] = useState({ meeting_date: "", start_date: "", duration: "" });
  const [form, setForm] = useState({ trade: "", company_name: "", contact_name: "", phone: "", email: "", bid_amount: "" });

  const handleSubmit = () => {
    if (!form.trade || !form.company_name || !form.contact_name) return;
    addBid.mutate({
      trade: form.trade,
      company_name: form.company_name,
      contact_name: form.contact_name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      bid_amount: form.bid_amount ? Number(form.bid_amount) : undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ trade: "", company_name: "", contact_name: "", phone: "", email: "", bid_amount: "" });
      }
    });
  };

  const copyInviteLink = (trade: string) => {
    const url = `${window.location.origin}/sub-bid/${projectId}/${encodeURIComponent(trade)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Invite link copied for ${trade}`);
  };

  const openAwardDialog = (bid: any) => {
    setAwardBid(bid);
    setAwardForm({ meeting_date: bid.meeting_date || "", start_date: bid.start_date || "", duration: bid.duration || "" });
    setAwardOpen(true);
  };

  const handleAward = () => {
    if (!awardBid) return;
    updateBid.mutate({
      id: awardBid.id,
      status: "awarded",
      ...(awardForm.meeting_date && { meeting_date: awardForm.meeting_date }),
      ...(awardForm.start_date && { start_date: awardForm.start_date }),
      ...(awardForm.duration && { duration: awardForm.duration }),
    } as any, {
      onSuccess: () => {
        setAwardOpen(false);
        setAwardBid(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Subcontractor Bids</h2>
        <div className="flex gap-2">
          {/* Quick invite link dropdown */}
          <Select onValueChange={(trade) => copyInviteLink(trade)}>
            <SelectTrigger className="w-[180px]">
              <Copy className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Copy Invite Link" />
            </SelectTrigger>
            <SelectContent>
              {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Subcontractor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subcontractor Bid</DialogTitle>
                <DialogDescription>Manually add a subcontractor bid entry.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Trade</Label>
                  <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}>
                    <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                    <SelectContent>
                      {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Bid Amount ($)</Label>
                  <Input type="number" value={form.bid_amount} onChange={(e) => setForm({ ...form, bid_amount: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={addBid.isPending}>
                  {addBid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Bid"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !bids?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No subcontractor bids yet. Click "Add Subcontractor" or share an invite link to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trade</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid: any) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">{bid.trade}</TableCell>
                    <TableCell>{bid.company_name}</TableCell>
                    <TableCell>
                      <div>{bid.contact_name}</div>
                      {bid.email && <div className="text-xs text-muted-foreground">{bid.email}</div>}
                    </TableCell>
                    <TableCell>{bid.bid_amount ? `$${Number(bid.bid_amount).toLocaleString()}` : "—"}</TableCell>
                    <TableCell>{bid.duration || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[bid.status] || "secondary"}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {bid.proposal_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={bid.proposal_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Proposal
                          </a>
                        </Button>
                      )}
                      {(bid.status === "pending" || bid.status === "submitted") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAwardDialog(bid)}
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" /> Award
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateBid.mutate({ id: bid.id, status: "rejected" })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Award Trade Dialog */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Award Trade — {awardBid?.trade}</DialogTitle>
            <DialogDescription>Set meeting and start dates for {awardBid?.company_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Meeting Date</Label>
              <Input type="date" value={awardForm.meeting_date} onChange={(e) => setAwardForm({ ...awardForm, meeting_date: e.target.value })} />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={awardForm.start_date} onChange={(e) => setAwardForm({ ...awardForm, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Duration</Label>
              <Input placeholder="e.g. 3 weeks" value={awardForm.duration} onChange={(e) => setAwardForm({ ...awardForm, duration: e.target.value })} />
            </div>
            <Button onClick={handleAward} className="w-full" disabled={updateBid.isPending}>
              {updateBid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Award"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
