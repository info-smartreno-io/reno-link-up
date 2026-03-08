import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { History, ChevronDown, ChevronRight, Palette, Package, RefreshCw, Plus, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Props {
  estimateId: string;
}

const SYNC_MODE_LABELS: Record<string, string> = {
  direct_sync: "Direct Sync",
  update_existing: "Update Existing",
  created_new: "Created New",
  duplicate_override: "Duplicate Override",
};

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: typeof RefreshCw }> = {
  downstream_design_package_created: { label: "Design Package created", icon: Plus },
  downstream_design_package_updated: { label: "Design Package synced", icon: RefreshCw },
  downstream_design_package_duplicate_override: { label: "Design Package duplicate override", icon: Copy },
  downstream_bid_packet_created: { label: "Bid Packet created", icon: Plus },
  downstream_bid_packet_updated: { label: "Bid Packet synced", icon: RefreshCw },
  downstream_bid_packet_duplicate_override: { label: "Bid Packet duplicate override", icon: Copy },
};

function FieldDiffRow({ fieldKey, oldValue, newValue }: { fieldKey: string; oldValue: string; newValue: string }) {
  const label = fieldKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div className="border rounded p-2 space-y-1">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Previous</p>
          <div className="text-xs bg-muted p-1.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">
            {oldValue || <span className="italic text-muted-foreground">Empty</span>}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">New</p>
          <div className="text-xs bg-primary/5 p-1.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">
            {newValue || <span className="italic text-muted-foreground">Empty</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncHistoryRow({ entry }: { entry: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const details = entry.action_details as any;
  if (!details) return null;

  const actionInfo = ACTION_TYPE_LABELS[entry.action_type];
  if (!actionInfo) return null;

  const Icon = actionInfo.icon;
  const targetType = details.target_type;
  const syncMode = details.sync_mode;
  const fieldCount = details.overwrite_field_count ?? details.fields_updated?.length ?? details.fields_mapped?.length ?? 0;
  const fieldsUpdated = details.fields_updated || details.fields_mapped || [];
  const oldValues = details.old_values || {};
  const newValues = details.new_values || {};
  const overrideReason = details.duplicate_override_reason || details.override_reason;
  const hasDiffs = Object.keys(oldValues).length > 0 || Object.keys(newValues).length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {targetType === "design_package" ? <Palette className="h-3.5 w-3.5 text-primary shrink-0" /> : <Package className="h-3.5 w-3.5 text-primary shrink-0" />}
            <span className="text-sm">{actionInfo.label}</span>
            {fieldCount > 0 && <Badge variant="outline" className="text-[10px]">{fieldCount} field{fieldCount !== 1 ? "s" : ""}</Badge>}
            {syncMode && <Badge variant="outline" className="text-[10px]">{SYNC_MODE_LABELS[syncMode] || syncMode}</Badge>}
            {overrideReason && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                <Copy className="h-2.5 w-2.5 mr-0.5" /> Override
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-1 mb-2 space-y-2">
          {details.target_id && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Target: <code className="text-[10px]">{details.target_id.slice(0, 12)}…</code>
            </p>
          )}
          {overrideReason && (
            <div className="p-2 border rounded bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Duplicate Override Reason</p>
              <p className="text-xs text-foreground mt-0.5">{overrideReason}</p>
            </div>
          )}
          {hasDiffs && fieldsUpdated.map((key: string) => (
            <FieldDiffRow
              key={key}
              fieldKey={key}
              oldValue={oldValues[key] || ""}
              newValue={newValues[key] || ""}
            />
          ))}
          {!hasDiffs && fieldsUpdated.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Fields mapped: {fieldsUpdated.join(", ")}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DownstreamSyncHistoryPanel({ estimateId }: Props) {
  const { data: syncEvents = [] } = useQuery({
    queryKey: ["downstream-sync-history", estimateId],
    queryFn: async () => {
      const downstreamActions = [
        "downstream_design_package_created",
        "downstream_design_package_updated",
        "downstream_design_package_duplicate_override",
        "downstream_bid_packet_created",
        "downstream_bid_packet_updated",
        "downstream_bid_packet_duplicate_override",
      ];
      const { data, error } = await supabase
        .from("smart_estimate_activity_log")
        .select("*")
        .eq("smart_estimate_id", estimateId)
        .in("action_type", downstreamActions)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  if (syncEvents.length === 0) return null;

  const latestSync = syncEvents[0];
  const latestDetails = latestSync?.action_details as any;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Downstream Sync History
          </CardTitle>
          {latestSync && (
            <span className="text-xs text-muted-foreground">
              Last sync: {format(new Date(latestSync.created_at), "MMM d, yyyy h:mm a")}
              {latestDetails?.sync_mode && ` • ${SYNC_MODE_LABELS[latestDetails.sync_mode] || latestDetails.sync_mode}`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {syncEvents.map((entry: any) => (
          <SyncHistoryRow key={entry.id} entry={entry} />
        ))}
      </CardContent>
    </Card>
  );
}
