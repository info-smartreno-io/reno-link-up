import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Palette, Package, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Props {
  estimateId: string;
  projectId?: string | null;
  estimateUpdatedAt?: string | null;
  onSyncRequest?: () => void;
}

type SyncStatus = "synced" | "never_synced" | "out_of_sync";

function computeSyncStatus(
  record: any,
  estimateId: string,
  estimateUpdatedAt: string | null
): SyncStatus {
  if (record.source_smart_estimate_id !== estimateId) return "never_synced";
  if (!record.last_synced_from_smart_estimate_at) return "never_synced";
  if (!estimateUpdatedAt) return "synced";
  return new Date(estimateUpdatedAt) > new Date(record.last_synced_from_smart_estimate_at)
    ? "out_of_sync"
    : "synced";
}

function determinePrimary(records: any[], estimateId: string): string | null {
  // Prefer: non-archived, matching source, latest synced
  const candidates = records
    .filter((r) => {
      const status = r.package_status || r.status;
      return status !== "archived";
    })
    .sort((a, b) => {
      const aMatch = a.source_smart_estimate_id === estimateId ? 1 : 0;
      const bMatch = b.source_smart_estimate_id === estimateId ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      const aSync = a.last_synced_from_smart_estimate_at ? new Date(a.last_synced_from_smart_estimate_at).getTime() : 0;
      const bSync = b.last_synced_from_smart_estimate_at ? new Date(b.last_synced_from_smart_estimate_at).getTime() : 0;
      return bSync - aSync;
    });
  return candidates[0]?.id ?? null;
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  switch (status) {
    case "synced":
      return (
        <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" /> Synced
        </Badge>
      );
    case "out_of_sync":
      return (
        <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Out of Sync
        </Badge>
      );
    case "never_synced":
      return (
        <Badge variant="outline" className="text-xs gap-1 border-muted text-muted-foreground">
          <AlertCircle className="h-3 w-3" /> Never Synced
        </Badge>
      );
  }
}

function DuplicateBadge({ snapshot }: { snapshot: any }) {
  if (!snapshot || snapshot.strategy !== "duplicate_override") return null;
  return (
    <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
      <Copy className="h-3 w-3" /> Duplicate Override
    </Badge>
  );
}

export function LinkedDownstreamRecordsCard({ estimateId, projectId, estimateUpdatedAt, onSyncRequest }: Props) {
  const navigate = useNavigate();

  const { data: designPackages = [] } = useQuery({
    queryKey: ["linked-downstream", "design_packages", estimateId],
    queryFn: async () => {
      const ids = new Set<string>();
      const results: any[] = [];
      const { data: bySource } = await supabase
        .from("design_packages")
        .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach((r) => { ids.add(r.id); results.push(r); });
      if (projectId) {
        const { data: byProject } = await supabase
          .from("design_packages")
          .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId)
          .neq("package_status", "archived");
        byProject?.forEach((r) => { if (!ids.has(r.id)) { ids.add(r.id); results.push(r); } });
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
        .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach((r) => { ids.add(r.id); results.push(r); });
      if (projectId) {
        const { data: byProject } = await supabase
          .from("bid_packets")
          .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId)
          .neq("status", "archived");
        byProject?.forEach((r) => { if (!ids.has(r.id)) { ids.add(r.id); results.push(r); } });
      }
      return results;
    },
  });

  const totalRecords = designPackages.length + bidPackets.length;
  if (totalRecords === 0) return null;

  const dpPrimaryId = determinePrimary(designPackages, estimateId);
  const bpPrimaryId = determinePrimary(bidPackets, estimateId);
  const hasOutOfSync = [...designPackages, ...bidPackets].some(
    (r) => computeSyncStatus(r, estimateId, estimateUpdatedAt ?? null) === "out_of_sync"
  );

  return (
    <Card className={hasOutOfSync ? "border-amber-300 dark:border-amber-700" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Linked Downstream Records
            {totalRecords > 1 && (
              <Badge variant="outline" className="text-xs">{totalRecords} records</Badge>
            )}
          </CardTitle>
          {hasOutOfSync && (
            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Updates Available
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {designPackages.map((pkg: any) => {
          const syncStatus = computeSyncStatus(pkg, estimateId, estimateUpdatedAt ?? null);
          const isPrimary = pkg.id === dpPrimaryId;
          const snapshot = pkg.source_mapping_snapshot as any;
          return (
            <div key={pkg.id} className={`flex items-center justify-between p-3 border rounded-lg ${syncStatus === "out_of_sync" ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Palette className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">Design Package</span>
                    <Badge variant="outline" className="text-xs">{pkg.package_status}</Badge>
                    <SyncStatusBadge status={syncStatus} />
                    {isPrimary && designPackages.length > 1 && <Badge className="text-xs">Primary</Badge>}
                    <DuplicateBadge snapshot={snapshot} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Created {format(new Date(pkg.created_at), "MMM d, yyyy")}
                    {pkg.last_synced_from_smart_estimate_at && ` • Synced ${format(new Date(pkg.last_synced_from_smart_estimate_at), "MMM d h:mm a")}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {syncStatus === "out_of_sync" && onSyncRequest && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={onSyncRequest}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Sync
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/design-packages/${pkg.id}`)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {bidPackets.map((pkt: any) => {
          const syncStatus = computeSyncStatus(pkt, estimateId, estimateUpdatedAt ?? null);
          const isPrimary = pkt.id === bpPrimaryId;
          const snapshot = pkt.source_mapping_snapshot as any;
          return (
            <div key={pkt.id} className={`flex items-center justify-between p-3 border rounded-lg ${syncStatus === "out_of_sync" ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">Bid Packet</span>
                    <Badge variant="outline" className="text-xs">{pkt.status}</Badge>
                    <SyncStatusBadge status={syncStatus} />
                    {isPrimary && bidPackets.length > 1 && <Badge className="text-xs">Primary</Badge>}
                    <DuplicateBadge snapshot={snapshot} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pkt.title} • Created {format(new Date(pkt.created_at), "MMM d, yyyy")}
                    {pkt.last_synced_from_smart_estimate_at && ` • Synced ${format(new Date(pkt.last_synced_from_smart_estimate_at), "MMM d h:mm a")}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {syncStatus === "out_of_sync" && onSyncRequest && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={onSyncRequest}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Sync
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bid-packets/${pkt.id}`)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
