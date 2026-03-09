import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const VENDOR_TYPES = ["cabinets", "flooring", "tile", "lighting", "countertops", "windows", "doors", "appliances", "lumber", "plumbing_fixtures"];

export default function EstimatorVendorQuotes() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || null;
  const [open, setOpen] = useState(false);
  const [vendorType, setVendorType] = useState("");
  const [materials, setMaterials] = useState("");
  const [quantities, setQuantities] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: quotes } = useQuery({
    queryKey: ["estimator-vendor-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createQuote = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const materialsList = materials.split("\n").filter(Boolean).map(m => ({ name: m.trim() }));
      const { error } = await supabase.from("vendor_quote_requests").insert({
        project_id: projectId, // Automatically linked when launched from project context
        vendor_type: vendorType,
        materials: materialsList,
        quantities: { items: quantities },
        notes,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimator-vendor-quotes"] });
      toast.success("Vendor quote request created");
      setOpen(false);
      setVendorType(""); setMaterials(""); setQuantities(""); setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Quote Requests</h1>
          <p className="text-sm text-muted-foreground">
            Request material pricing from vendors
            {projectId && <Badge variant="outline" className="ml-2 text-xs">Project linked</Badge>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Vendor Quote Request</DialogTitle>
              <DialogDescription>
                {projectId ? "This request will be linked to the current project." : "Select materials and vendor type below."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Vendor Type</label>
                <Select value={vendorType} onValueChange={setVendorType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {VENDOR_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Materials (one per line)</label>
                <Textarea value={materials} onChange={e => setMaterials(e.target.value)} placeholder="e.g. Shaker White 36in Base Cabinet" rows={4} />
              </div>
              <div>
                <label className="text-sm font-medium">Quantities</label>
                <Input value={quantities} onChange={e => setQuantities(e.target.value)} placeholder="e.g. 12 base, 8 wall, 4 tall" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." rows={2} />
              </div>
              <Button onClick={() => createQuote.mutate()} disabled={!vendorType || !materials} className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Your Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes?.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{q.vendor_type?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">
                    {Array.isArray(q.materials) ? q.materials.map((m: any) => m.name || m).join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {q.project_id ? <Badge variant="outline" className="text-xs">Linked</Badge> : <span className="text-muted-foreground text-xs">Unlinked</span>}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{q.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {(!quotes || quotes.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No vendor requests yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
