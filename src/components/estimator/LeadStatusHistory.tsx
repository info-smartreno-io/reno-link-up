import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, User, MessageSquare, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface StatusHistoryEntry {
  id: string;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  reason: string | null;
  changed_by_name?: string;
}

interface LeadStatusHistoryProps {
  leadId: string;
}

const statusColors: Record<string, string> = {
  new_lead: "hsl(217, 91%, 60%)",
  call_24h: "hsl(45, 93%, 47%)",
  walkthrough: "hsl(262, 83%, 58%)",
  scope_sent: "hsl(142, 76%, 36%)",
  scope_adjustment: "hsl(30, 80%, 55%)",
  architectural_design: "hsl(280, 65%, 60%)",
  bid_room: "hsl(195, 75%, 45%)",
  smart_bid_3: "hsl(340, 75%, 55%)",
  financing: "hsl(160, 70%, 50%)",
  bid_accepted: "hsl(120, 60%, 50%)",
  on_hold: "hsl(40, 70%, 60%)",
  lost: "hsl(0, 70%, 50%)",
};

export function LeadStatusHistory({ leadId }: LeadStatusHistoryProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);

  useEffect(() => {
    fetchHistory();

    // Set up real-time subscription
    const channel = supabase
      .channel(`lead-history-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lead_stage_history",
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_stage_history")
        .select(`
          *,
          profiles:changed_by (
            full_name
          )
        `)
        .eq("lead_id", leadId)
        .order("changed_at", { ascending: false });

      if (error) throw error;

      // Map the data to include changed_by_name
      const mappedData = (data || []).map((entry: any) => ({
        ...entry,
        changed_by_name: entry.profiles?.full_name || "System",
      }));

      setHistory(mappedData);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load status history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return "New";
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No status changes recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0 last:pb-0"
            >
              <div
                className="absolute left-[-9px] top-0 h-4 w-4 rounded-full border-2 border-background"
                style={{
                  backgroundColor: statusColors[entry.to_status] || "#666",
                }}
              />

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.from_status && (
                      <>
                        <Badge
                          variant="outline"
                          style={{
                            borderLeftColor: statusColors[entry.from_status],
                            borderLeftWidth: "3px",
                          }}
                        >
                          {formatStatus(entry.from_status)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                    <Badge
                      variant="secondary"
                      style={{
                        borderLeftColor: statusColors[entry.to_status],
                        borderLeftWidth: "3px",
                      }}
                    >
                      {formatStatus(entry.to_status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.changed_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {entry.changed_by_name}
                </div>

                {entry.reason && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Reason:</p>
                      <p className="text-muted-foreground">{entry.reason}</p>
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Notes:</p>
                      <p className="text-muted-foreground">{entry.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
