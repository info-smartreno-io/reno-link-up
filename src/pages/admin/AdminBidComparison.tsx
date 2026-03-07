import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminBidComparison() {
  const { packetId } = useParams<{ packetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: packet } = useQuery({
    queryKey: ["comparison-packet", packetId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bid_packets").select("*").eq("id", packetId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!packetId,
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["comparison-submissions", packetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_submissions")
        .select("*, profiles:bidder_id(full_name, email)")
        .eq("bid_opportunity_id", packetId!)
        .in("status", ["submitted", "awarded"])
        .order("bid_amount", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!packetId,
  });

  const awardMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      await supabase.from("bid_submissions").update({ status: "awarded" }).eq("id", submissionId);
      await supabase.from("bid_packets").update({ status: "awarded" }).eq("id", packetId!);
      if (packet?.project_id) {
        await supabase.from("projects").update({ status: "contractor_selected" }).eq("id", packet.project_id);
      }
      if (packet?.design_package_id) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("design_package_activity_log").insert({
          design_package_id: packet.design_package_id,
          actor_id: user?.id,
          actor_role: "admin",
          action_type: "contractor_awarded",
          action_details: `Contractor awarded from comparison. Submission: ${submissionId.slice(0, 8)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-submissions", packetId] });
      queryClient.invalidateQueries({ queryKey: ["comparison-packet", packetId] });
      toast.success("Contractor awarded!");
    },
  });

  const lowestBid = submissions?.length ? Math.min(...submissions.map((s: any) => Number(s.bid_amount))) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/bid-packets/${packetId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bid Comparison</h1>
            <p className="text-muted-foreground text-sm">{packet?.title || "Loading..."}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !submissions?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No submitted bids to compare</CardContent></Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{submissions.length}</p>
                <p className="text-xs text-muted-foreground">Total Bids</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-mono">${lowestBid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Lowest Bid</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-mono">
                  ${Math.round(submissions.reduce((s: number, b: any) => s + Number(b.bid_amount), 0) / submissions.length).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Average Bid</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{packet?.bid_deadline ? format(new Date(packet.bid_deadline), "MMM d") : "—"}</p>
                <p className="text-xs text-muted-foreground">Deadline</p>
              </CardContent></Card>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader><CardTitle>Side-by-Side Comparison</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Metric</TableHead>
                      {submissions.map((s: any) => (
                        <TableHead key={s.id} className="min-w-[160px]">
                          <div>
                            <p className="font-medium">{s.profiles?.full_name || s.profiles?.email || "Bidder"}</p>
                            {s.status === "awarded" && <Badge className="mt-1 bg-green-100 text-green-800 text-xs">Awarded</Badge>}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Bid Amount</TableCell>
                      {submissions.map((s: any) => (
                        <TableCell key={s.id} className={`font-mono ${Number(s.bid_amount) === lowestBid ? "text-green-600 font-bold" : ""}`}>
                          ${Number(s.bid_amount).toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Timeline</TableCell>
                      {submissions.map((s: any) => <TableCell key={s.id}>{s.estimated_timeline || "—"}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Proposal</TableCell>
                      {submissions.map((s: any) => <TableCell key={s.id} className="text-sm max-w-[200px] truncate">{s.proposal_text || "—"}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Warranty</TableCell>
                      {submissions.map((s: any) => <TableCell key={s.id}>{s.warranty_terms || s.warranty_years ? `${s.warranty_years}yr` : "—"}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Submitted</TableCell>
                      {submissions.map((s: any) => <TableCell key={s.id} className="text-sm">{format(new Date(s.submitted_at), "MMM d, h:mm a")}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Action</TableCell>
                      {submissions.map((s: any) => (
                        <TableCell key={s.id}>
                          {s.status === "submitted" && packet?.status !== "awarded" ? (
                            <Button size="sm" onClick={() => awardMutation.mutate(s.id)} disabled={awardMutation.isPending}>
                              <Trophy className="mr-1 h-3 w-3" /> Award
                            </Button>
                          ) : s.status === "awarded" ? (
                            <Badge className="bg-green-100 text-green-800">Winner</Badge>
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
