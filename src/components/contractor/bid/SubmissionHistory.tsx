import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SubmissionHistoryProps {
  submissionId: string;
}

export function SubmissionHistory({ submissionId }: SubmissionHistoryProps) {
  const { data: history = [] } = useQuery({
    queryKey: ["bid-submission-history", submissionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bid_submission_history")
        .select("*")
        .eq("bid_submission_id", submissionId)
        .order("snapshot_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!submissionId,
  });

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Submission History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((entry: any) => (
          <Collapsible key={entry.id}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{entry.status}</Badge>
                  {entry.bid_amount && (
                    <span className="text-sm flex items-center gap-0.5">
                      <DollarSign className="h-3 w-3" />
                      {Number(entry.bid_amount).toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.snapshot_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 ml-4 border-l-2 border-muted space-y-2 text-sm">
                {entry.estimated_timeline && (
                  <div>
                    <span className="text-xs text-muted-foreground">Timeline:</span>
                    <p>{entry.estimated_timeline}</p>
                  </div>
                )}
                {entry.proposal_text && (
                  <div>
                    <span className="text-xs text-muted-foreground">Proposal:</span>
                    <p className="line-clamp-3">{entry.proposal_text}</p>
                  </div>
                )}
                {entry.revision_notes && (
                  <div>
                    <span className="text-xs text-muted-foreground">Revision Notes:</span>
                    <p className="text-amber-700 dark:text-amber-400">{entry.revision_notes}</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
