import { useState } from "react";
import { useProjectDailyLogs } from "@/hooks/contractor/useProjectDailyLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, CloudSun, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ProjectDailyLogsProps {
  projectId: string;
}

export function ProjectDailyLogs({ projectId }: ProjectDailyLogsProps) {
  const { data: logs, isLoading, addLog } = useProjectDailyLogs(projectId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    log_date: new Date().toISOString().split("T")[0],
    notes: "",
    weather_conditions: "",
    workers_on_site: "",
  });

  const handleSubmit = () => {
    if (!form.log_date) return;
    addLog.mutate({
      log_date: form.log_date,
      notes: form.notes || undefined,
      weather_conditions: form.weather_conditions || undefined,
      workers_on_site: form.workers_on_site ? Number(form.workers_on_site) : undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ log_date: new Date().toISOString().split("T")[0], notes: "", weather_conditions: "", workers_on_site: "" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Daily Logs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Log Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Daily Log</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} />
              </div>
              <div>
                <Label>Weather</Label>
                <Input value={form.weather_conditions} onChange={(e) => setForm({ ...form, weather_conditions: e.target.value })} placeholder="e.g. Sunny, 75°F" />
              </div>
              <div>
                <Label>Workers on Site</Label>
                <Input type="number" value={form.workers_on_site} onChange={(e) => setForm({ ...form, workers_on_site: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="What happened today..." />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addLog.isPending}>
                {addLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Log"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !logs?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No daily logs yet. Click "New Log Entry" to start tracking progress.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(log.log_date), "MMM d, yyyy")}
                  </span>
                  {log.weather_conditions && (
                    <span className="flex items-center gap-1">
                      <CloudSun className="h-3.5 w-3.5" />
                      {log.weather_conditions}
                    </span>
                  )}
                  {log.workers_on_site != null && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {log.workers_on_site} workers
                    </span>
                  )}
                </div>
                {log.notes && <p className="text-sm whitespace-pre-wrap">{log.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
