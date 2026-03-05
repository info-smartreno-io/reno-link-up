import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Loader2,
  Send
} from "lucide-react";

interface StartDateAuthProps {
  projectId: string;
  isReadOnly?: boolean;
  allGatesComplete?: boolean;
}

export function StartDateAuth({ projectId, isReadOnly = false, allGatesComplete = false }: StartDateAuthProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposedDate, setProposedDate] = useState<Date>();
  const [notes, setNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["start-date-requests", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pc_start_date_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const proposeDateMutation = useMutation({
    mutationFn: async () => {
      if (!proposedDate) return;
      
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("pc_start_date_requests").insert({
        project_id: projectId,
        proposed_start_date: format(proposedDate, "yyyy-MM-dd"),
        proposed_by: user.user?.id,
        notes,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["start-date-requests", projectId] });
      toast({ title: "Start date proposed", description: "Awaiting PM approval" });
      setProposedDate(undefined);
      setNotes("");
    },
    onError: () => {
      toast({ title: "Failed to propose date", variant: "destructive" });
    },
  });

  const latestRequest = requests[0];
  const hasPendingRequest = latestRequest?.status === "pending";
  const hasApprovedRequest = latestRequest?.status === "approved";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start Date Authorization</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasApprovedRequest ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          Start Date Authorization
          {hasApprovedRequest && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        </CardTitle>
        <CardDescription>
          PC proposes start date, PM must approve
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        {latestRequest && (
          <div className={`p-4 rounded-lg border ${
            latestRequest.status === "approved" 
              ? "bg-green-500/10 border-green-500/30"
              : latestRequest.status === "rejected"
              ? "bg-red-500/10 border-red-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Latest Request</span>
              <Badge variant={
                latestRequest.status === "approved" ? "default" :
                latestRequest.status === "rejected" ? "destructive" : "secondary"
              }>
                {latestRequest.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {latestRequest.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                {latestRequest.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                {latestRequest.status}
              </Badge>
            </div>
            <p className="text-lg font-bold">
              {format(new Date(latestRequest.proposed_start_date), "MMMM d, yyyy")}
            </p>
            {latestRequest.notes && (
              <p className="text-sm text-muted-foreground mt-1">{latestRequest.notes}</p>
            )}
            {latestRequest.rejection_reason && (
              <p className="text-sm text-red-600 mt-1">
                Reason: {latestRequest.rejection_reason}
              </p>
            )}
          </div>
        )}

        {/* Propose New Date */}
        {!isReadOnly && !hasPendingRequest && !hasApprovedRequest && (
          <div className="space-y-3">
            {!allGatesComplete && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-700">
                Complete all build-ready gates before proposing a start date
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Proposed Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!allGatesComplete}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !proposedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {proposedDate ? format(proposedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={proposedDate}
                    onSelect={setProposedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Materials confirmed, subs ready, site access verified..."
                rows={2}
                disabled={!allGatesComplete}
              />
            </div>

            <Button
              onClick={() => proposeDateMutation.mutate()}
              disabled={!proposedDate || !allGatesComplete || proposeDateMutation.isPending}
              className="w-full gap-2"
            >
              {proposeDateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Propose Start Date
                </>
              )}
            </Button>
          </div>
        )}

        {/* Request History */}
        {requests.length > 1 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Previous Requests</p>
            <div className="space-y-2">
              {requests.slice(1, 4).map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <span>{format(new Date(req.proposed_start_date), "MMM d, yyyy")}</span>
                  <Badge variant="outline" className="text-xs">
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
