import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Palette, Package, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type SyncStatus = "synced" | "never_synced" | "out_of_sync";
type OverallSyncStatus = "no_downstream_records" | "all_synced" | "out_of_sync" | "multiple_records";

interface Props {
  estimateId: string;
  projectId?: string | null;
  estimateUpdatedAt?: string | null;
  /** Called with target type and the specific record to sync */
  onSyncRecord?: (target: "design_package" | "bid_packet", record: any) => void;
}

function computeSyncStatus(record: any, estimateId: string, estimateUpdatedAt: string | null): SyncStatus {
  if (record.source_smart_estimate_id !== estimateId) return "never_synced";
  if (!record.last_synced_from_smart_estimate_at) return "never_synced";
  if (!estimateUpdatedAt) return "synced";
  return new Date(estimateUpdatedAt) > new Date(record.last_synced_from_smart_estimate_at) ? "out_of_sync" : "synced";
}

function determinePrimary(records: any[], estimateId: string): string | null {
  const candidates = records
    .filter((r) => (r.package_status || r.status) !== "archived")
    .sort((a, b) => {
      const aMatch = a.source_smart_estimate_id === estimateId ? 1 : 0;
      const bMatch = b.source_smart_estimate_id === estimateId ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      const aSync = a.last_synced_from_smart_estimate_at ? new Date(a.last_synced_from_smart_estimate_at).getTime() : 0;
      const bSync = b.last_synced_from_smart_estimate_at ? new Date(b.last_synced_from_smart_estimate_at).getTime() : 0;
      if (aSync !== bSync) return bSync - aSync;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
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

/** Header-level sync summary badge for the Smart Estimate detail page */
export function DownstreamSyncSummaryBadge({ estimateId, projectId, estimateUpdatedAt }: {
  estimateId: string; projectId?: string | null; estimateUpdatedAt?: string | null;
}) {
  const { data: status } = useQuery({
    queryKey: ["downstream-sync-summary", estimateId, estimateUpdatedAt],
    queryFn: async (): Promise<OverallSyncStatus> => {
      const allRecords: { record: any; type: string }[] = [];

      const { data: dpBySource } = await supabase.from("design_packages")
        .select("id, package_status, source_smart_estimate_id, last_synced_from_smart_estimate_at, updated_at, created_at")
        .eq("source_smart_estimate_id", estimateId);
      dpBySource?.forEach(r => allRecords.push({ record: r, type: "dp" }));

      if (projectId) {
        const ids = new Set(allRecords.map(r => r.record.id));
        const { data: dpByProject } = await supabase.from("design_packages")
          .select("id, package_status, source_smart_estimate_id, last_synced_from_smart_estimate_at, updated_at, created_at")
          .eq("project_id", projectId).neq("package_status", "archived");
        dpByProject?.forEach(r => { if (!ids.has(r.id)) allRecords.push({ record: r, type: "dp" }); });
      }

      const { data: bpBySource } = await supabase.from("bid_packets")
        .select("id, status, source_smart_estimate_id, last_synced_from_smart_estimate_at, updated_at, created_at")
        .eq("source_smart_estimate_id", estimateId);
      bpBySource?.forEach(r => allRecords.push({ record: r, type: "bp" }));

      if (projectId) {
        const ids = new Set(allRecords.map(r => r.record.id));
        const { data: bpByProject } = await supabase.from("bid_packets")
          .select("id, status, source_smart_estimate_id, last_synced_from_smart_estimate_at, updated_at, created_at")
          .eq("project_id", projectId).neq("status", "archived");
        bpByProject?.forEach(r => { if (!ids.has(r.id)) allRecords.push({ record: r, type: "bp" }); });
      }

      if (allRecords.length === 0) return "no_downstream_records";

      const dpCount = allRecords.filter(r => r.type === "dp").length;
      const bpCount = allRecords.filter(r => r.type === "bp").length;
      if (dpCount > 1 || bpCount > 1) return "multiple_records";

      const hasOutOfSync = allRecords.some(({ record }) =>
        computeSyncStatus(record, estimateId, estimateUpdatedAt ?? null) === "out_of_sync"
      );
      return hasOutOfSync ? "out_of_sync" : "all_synced";
    },
  });

  if (!status || status === "no_downstream_records") return null;

  switch (status) {
    case "all_synced":
      return (
        <Badge variant="outline" className="gap-1 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" /> All Downstream Synced
        </Badge>
      );
    case "out_of_sync":
      return (
        <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Downstream Updates Available
        </Badge>
      );
    case "multiple_records":
      return (
        <Badge variant="outline" className="gap-1">
          <Package className="h-3 w-3" /> Multiple Downstream Records
        </Badge>
      );
  }
}

export function LinkedDownstreamRecordsCard({ estimateId, projectId, estimateUpdatedAt, onSyncRecord }: Props) {
  const navigate = useNavigate();

  const { data: designPackages = [] } = useQuery({
    queryKey: ["linked-downstream", "design_packages", estimateId],
    queryFn: async () => {
      const ids = new Set<string>();
      const results: any[] = [];
      const { data: bySource } = await supabase.from("design_packages")
        .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach(r => { ids.add(r.id); results.push(r); });
      if (projectId) {
        const { data: byProject } = await supabase.from("design_packages")
          .select("id, package_status, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId).neq("package_status", "archived");
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
      const { data: bySource } = await supabase.from("bid_packets")
        .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
        .eq("source_smart_estimate_id", estimateId);
      bySource?.forEach(r => { ids.add(r.id); results.push(r); });
      if (projectId) {
        const { data: byProject } = await supabase.from("bid_packets")
          .select("id, status, title, created_at, updated_at, source_smart_estimate_id, source_type, source_mapping_snapshot, last_synced_from_smart_estimate_at")
          .eq("project_id", projectId).neq("status", "archived");
        byProject?.forEach(r => { if (!ids.has(r.id)) { ids.add(r.id); results.push(r); } });
      }
      return results;
    },
  });

  const totalRecords = designPackages.length + bidPackets.length;
  if (totalRecords === 0) return null;

  const dpPrimaryId = determinePrimary(designPackages, estimateId);
  const bpPrimaryId = determinePrimary(bidPackets, estimateId);
  const hasOutOfSync = [...designPackages, ...bidPackets].some(
    r => computeSyncStatus(r, estimateId, estimateUpdatedAt ?? null) === "out_of_sync"
  );

  return (
    <Card className={hasOutOfSync ? "border-amber-300 dark:border-amber-700" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Linked Downstream Records
            {totalRecords > 1 && <Badge variant="outline" className="text-xs">{totalRecords} records</Badge>}
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
                {syncStatus === "out_of_sync" && onSyncRecord && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => onSyncRecord("design_package", pkg)}>
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
                {syncStatus === "out_of_sync" && onSyncRecord && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => onSyncRecord("bid_packet", pkt)}>
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
