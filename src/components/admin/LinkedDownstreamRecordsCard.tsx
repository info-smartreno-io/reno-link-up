import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Palette, Package, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Props {
  estimateId: string;
  projectId?: string | null;
}

export function LinkedDownstreamRecordsCard({ estimateId, projectId }: Props) {
  const navigate = useNavigate();

  const { data: designPackages = [] } = useQuery({
    queryKey: ["linked-downstream", "design_packages", estimateId],
    queryFn: async () => {
      const ids = new Set<string>();
      const results: any[] = [];

      const { data: bySource } = await supabase
        .from("design_packages")
        .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach(r => { ids.add(r.id); results.push(r); });

      if (projectId) {
        const { data: byProject } = await supabase
          .from("design_packages")
          .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId)
          .neq("package_status", "archived");
        byProject?.forEach(r => { if (!ids.has(r.id)) { ids.add(r.id); results.push(r); } });
      }
      return results;
    },
  });

  const { data: bidPackets = [] } = useQuery({
    queryKey: ["linked-downstream", "bid_packets", estimateId],
    queryFn: async () => {
      const ids = new Set<string>();
      const results: any[] = [];

      const { data: bySource } = await supabase
        .from("bid_packets")
        .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach(r => { ids.add(r.id); results.push(r); });

      if (projectId) {
        const { data: byProject } = await supabase
          .from("bid_packets")
          .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId)
          .neq("status", "archived");
        byProject?.forEach(r => { if (!ids.has(r.id)) { ids.add(r.id); results.push(r); } });
      }
      return results;
    },
  });

  if (designPackages.length === 0 && bidPackets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Linked Downstream Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {designPackages.map((pkg: any, idx: number) => (
          <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Design Package</span>
                  <Badge variant="outline" className="text-xs">{pkg.package_status}</Badge>
                  {idx === 0 && designPackages.length > 1 && <Badge className="text-xs">Primary</Badge>}
                  {pkg.source_smart_estimate_id === estimateId && <Badge variant="secondary" className="text-xs">From This Estimate</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(pkg.created_at), "MMM d, yyyy")}
                  {pkg.last_synced_from_smart_estimate_at && ` • Synced ${format(new Date(pkg.last_synced_from_smart_estimate_at), "MMM d h:mm a")}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/design-packages/${pkg.id}`)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {bidPackets.map((pkt: any, idx: number) => (
          <div key={pkt.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bid Packet</span>
                  <Badge variant="outline" className="text-xs">{pkt.status}</Badge>
                  {idx === 0 && bidPackets.length > 1 && <Badge className="text-xs">Primary</Badge>}
                  {pkt.source_smart_estimate_id === estimateId && <Badge variant="secondary" className="text-xs">From This Estimate</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pkt.title} • Created {format(new Date(pkt.created_at), "MMM d, yyyy")}
                  {pkt.last_synced_from_smart_estimate_at && ` • Synced ${format(new Date(pkt.last_synced_from_smart_estimate_at), "MMM d h:mm a")}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bid-packets/${pkt.id}`)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
