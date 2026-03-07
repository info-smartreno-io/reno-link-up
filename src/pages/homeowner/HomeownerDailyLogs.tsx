import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Calendar, Wrench, CloudSun } from "lucide-react";

export default function HomeownerDailyLogs() {
  const { projectId } = useParams();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["homeowner-daily-logs", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      // Try project_daily_logs first (client-visible logs)
      const { data, error } = await supabase
        .from("project_daily_logs")
        .select("*")
        .eq("project_id", projectId!)
        .eq("is_client_visible", true)
        .order("log_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  if (!logs?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No daily logs yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Progress updates and photos will appear here once construction begins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Daily Progress</h3>
        <p className="text-xs text-muted-foreground mt-1">
          See what's happening on your jobsite each day.
        </p>
      </div>

      <div className="space-y-4">
        {logs.map((log: any) => {
          const uploads = Array.isArray(log.uploads) ? log.uploads : [];

          return (
            <Card key={log.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(log.log_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {log.weather && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CloudSun className="h-3 w-3" />
                      {log.weather}
                    </Badge>
                  )}
                </div>

                {/* Work completed */}
                {log.work_completed && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" /> Work Completed
                    </p>
                    <p className="text-sm text-foreground">{log.work_completed}</p>
                  </div>
                )}

                {/* Crew summary */}
                {log.crew_summary && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Crew:</span> {log.crew_summary}
                  </p>
                )}

                {/* Next steps */}
                {log.next_steps && (
                  <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary">Next Steps</p>
                    <p className="text-sm text-foreground mt-0.5">{log.next_steps}</p>
                  </div>
                )}

                {/* Photos */}
                {uploads.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Camera className="h-3 w-3" /> {uploads.length} Photo{uploads.length > 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {uploads.slice(0, 8).map((url: string, i: number) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={url}
                            alt={`Progress photo ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blockers */}
                {log.blockers && (
                  <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10">
                    <p className="text-xs font-medium text-destructive">Note</p>
                    <p className="text-sm text-foreground mt-0.5">{log.blockers}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
