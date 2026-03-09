import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Building2, Palette, Star, MapPin, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminImportedBusinesses() {
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState<"contractor" | "designer">("contractor");
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["admin-imported-businesses", businessType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_businesses" as any)
        .select("*")
        .eq("business_type", businessType)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: claimRequests } = useQuery({
    queryKey: ["admin-claim-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_claim_requests" as any)
        .select("*, imported_businesses(business_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = businesses?.filter((b) =>
    !search ||
    b.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleClaimApproval = async (claimId: string, businessId: string, approve: boolean) => {
    const { error } = await supabase
      .from("profile_claim_requests" as any)
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", claimId);

    if (!error && approve) {
      await supabase
        .from("imported_businesses" as any)
        .update({ claim_status: "verified" })
        .eq("id", businessId);
    }

    if (error) {
      toast.error("Failed to update claim");
    } else {
      toast.success(approve ? "Claim approved" : "Claim rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-claim-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-imported-businesses"] });
    }
  };

  const totalBusinesses = businesses?.length || 0;
  const verifiedCount = businesses?.filter((b) => b.claim_status === "verified").length || 0;
  const pendingClaims = claimRequests?.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imported Businesses</h1>
          <p className="text-muted-foreground">Google Places imports and claim requests</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Businesses", value: totalBusinesses, icon: Building2 },
            { label: "Verified", value: verifiedCount, icon: CheckCircle },
            { label: "Pending Claims", value: pendingClaims, icon: Clock },
            { label: "Avg Rating", value: businesses?.length ? (businesses.reduce((s, b) => s + (b.google_rating || 0), 0) / businesses.length).toFixed(1) : "—", icon: Star },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Claims Alert */}
        {pendingClaims > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">{pendingClaims} pending claim request{pendingClaims > 1 ? "s" : ""}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected({ type: "claims" })}>
                  Review Claims
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={businessType} onValueChange={(v) => setBusinessType(v as "contractor" | "designer")}>
          <TabsList>
            <TabsTrigger value="contractor" className="gap-2">
              <Building2 className="h-4 w-4" /> Contractors
            </TabsTrigger>
            <TabsTrigger value="designer" className="gap-2">
              <Palette className="h-4 w-4" /> Designers
            </TabsTrigger>
          </TabsList>

          <TabsContent value={businessType} className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Imported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filtered?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No businesses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered?.map((b) => (
                        <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(b)}>
                          <TableCell className="font-medium">{b.business_name}</TableCell>
                          <TableCell>{b.city || "—"}</TableCell>
                          <TableCell className="capitalize">{b.category?.replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell>
                            {b.google_rating ? (
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                {b.google_rating} ({b.review_count})
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {b.claim_status === "verified" ? (
                              <Badge className="bg-accent text-accent-foreground">Verified</Badge>
                            ) : b.claim_status === "pending_review" ? (
                              <Badge variant="outline" className="border-primary text-primary">Pending</Badge>
                            ) : (
                              <Badge variant="secondary">Unclaimed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm capitalize">{b.source || "manual"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(b.created_at), "MMM d")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Claims Review Sheet */}
      <Sheet open={selected?.type === "claims"} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Pending Claim Requests</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {claimRequests?.map((claim) => (
              <Card key={claim.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold">{claim.company_name}</p>
                    <p className="text-sm text-muted-foreground">{claim.full_name} • {claim.relationship}</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Email:</strong> {claim.email}</p>
                    {claim.phone && <p><strong>Phone:</strong> {claim.phone}</p>}
                    {claim.notes && <p><strong>Notes:</strong> {claim.notes}</p>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => handleClaimApproval(claim.id, claim.business_id, true)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleClaimApproval(claim.id, claim.business_id, false)}>
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!claimRequests || claimRequests.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No pending claims</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Business Detail Sheet */}
      <Sheet open={selected && !selected.type} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.business_name}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                {selected.category && <p className="text-sm capitalize"><strong>Category:</strong> {selected.category.replace(/_/g, " ")}</p>}
                {selected.address && <p className="text-sm"><strong>Address:</strong> {selected.address}</p>}
                {selected.phone && <p className="text-sm"><strong>Phone:</strong> {selected.phone}</p>}
                {selected.website && (
                  <p className="text-sm">
                    <strong>Website:</strong>{" "}
                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selected.website} <ExternalLink className="inline h-3 w-3" />
                    </a>
                  </p>
                )}
                {selected.google_rating && (
                  <p className="text-sm flex items-center gap-1">
                    <strong>Rating:</strong>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {selected.google_rating} ({selected.review_count} reviews)
                  </p>
                )}
                {selected.map_link && (
                  <a href={selected.map_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> View on Google Maps
                  </a>
                )}
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Source:</strong> {selected.source || "manual"} • <strong>Imported:</strong> {format(new Date(selected.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Google Place ID:</strong> {selected.google_place_id || "—"}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
