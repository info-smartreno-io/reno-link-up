import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminBids } from "@/hooks/useAdminBids";
import { Search, Eye, GitCompare, Star, XCircle } from "lucide-react";
import { format } from "date-fns";

function bidStatusBadge(status: string) {
  switch (status) {
    case "submitted": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "shortlisted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "awarded": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function AdminBidReview() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const { data: bids, isLoading, updateStatus } = useAdminBids();

  const filtered = bids?.filter((b) =>
    !search ||
    (b.bid_opportunities as any)?.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.bidder_type?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const compareBids = bids?.filter((b) => compareIds.has(b.id)) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bid Review & Shortlist</h1>
            <p className="text-muted-foreground">Compare bids and prepare homeowner shortlist</p>
          </div>
          {compareIds.size >= 2 && (
            <Button onClick={() => setShowCompare(true)}>
              <GitCompare className="h-4 w-4 mr-2" /> Compare ({compareIds.size})
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bids..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Compare</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Bidder Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No bids found</TableCell></TableRow>
                ) : (
                  filtered?.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <Checkbox
                          checked={compareIds.has(bid.id)}
                          onCheckedChange={() => toggleCompare(bid.id)}
                          disabled={!compareIds.has(bid.id) && compareIds.size >= 3}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{(bid.bid_opportunities as any)?.title || "—"}</TableCell>
                      <TableCell className="capitalize">{bid.bidder_type}</TableCell>
                      <TableCell className="font-mono">${Number(bid.bid_amount).toLocaleString()}</TableCell>
                      <TableCell>{bid.estimated_timeline || "—"}</TableCell>
                      <TableCell><Badge className={bidStatusBadge(bid.status)}>{bid.status}</Badge></TableCell>
                      <TableCell>{format(new Date(bid.submitted_at), "MMM d")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(bid)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: bid.id, status: "shortlisted" })} title="Shortlist">
                          <Star className="h-4 w-4 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: bid.id, status: "rejected" })} title="Reject">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Bid Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <div><p className="text-xs text-muted-foreground">Project</p><p className="font-medium">{(selected.bid_opportunities as any)?.title}</p></div>
              <div><p className="text-xs text-muted-foreground">Amount</p><p className="text-xl font-bold">${Number(selected.bid_amount).toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Timeline</p><p>{selected.estimated_timeline || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Proposal</p><p className="text-sm">{selected.proposal_text || "No proposal text"}</p></div>
              <div><p className="text-xs text-muted-foreground">Warranty</p><p>{selected.warranty_terms || "—"}</p></div>
              {Array.isArray(selected.bid_line_items) && selected.bid_line_items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Line Items ({selected.bid_line_items.length})</p>
                  <div className="space-y-1 text-sm">
                    {selected.bid_line_items.map((li: any) => (
                      <div key={li.id} className="flex justify-between py-1 border-b border-border">
                        <span className="truncate flex-1">{li.description}</span>
                        <span className="font-mono ml-2">${Number(li.total || li.unit_price * li.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Compare Sheet */}
      <Sheet open={showCompare} onOpenChange={setShowCompare}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Compare Bids ({compareBids.length})</SheetTitle></SheetHeader>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {compareBids.map((b) => (
                    <TableHead key={b.id}>{(b.bid_opportunities as any)?.title?.slice(0, 20) || "Bid"}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Amount</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id} className="font-mono">${Number(b.bid_amount).toLocaleString()}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Timeline</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id}>{b.estimated_timeline || "—"}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Duration (weeks)</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id}>{b.project_duration_weeks || "—"}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Warranty</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id}>{b.warranty_years ? `${b.warranty_years}yr` : "—"}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Line Items</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id}>{Array.isArray(b.bid_line_items) ? b.bid_line_items.length : 0}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  {compareBids.map((b) => <TableCell key={b.id}><Badge className={bidStatusBadge(b.status)}>{b.status}</Badge></TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
