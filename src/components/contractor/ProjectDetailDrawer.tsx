import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Deadline } from "./Deadline";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Phone, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type ContractorProjectRow = {
  id: string;
  name: string;
  address: string | null;
  workflow_status: string;
  budget_estimate: number | null;
  last_contact_at: string | null;
  next_step_title: string | null;
  next_step_due_at: string | null;
  next_step_status: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectEvent = {
  id: number;
  created_at: string;
  event_type: string;
  payload: any;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ContractorProjectRow | null;
};

export function ProjectDetailDrawer({ open, onOpenChange, project }: Props) {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !project) return;
    
    const loadEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("project_events" as any)
          .select("id, created_at, event_type, payload")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!error && data) {
          setEvents(data as any as ProjectEvent[]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [open, project]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <Phone className="size-4 text-primary" />;
      case "file":
        return <FileText className="size-4 text-primary" />;
      case "status_change":
        return <CheckCircle className="size-4 text-primary" />;
      case "next_step":
        return <AlertCircle className="size-4 text-primary" />;
      default:
        return <MessageSquare className="size-4 text-primary" />;
    }
  };

  const formatEventType = (type: string) => {
    return type.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>{project?.name}</span>
            {project && <StatusBadge value={project.workflow_status} />}
          </DrawerTitle>
          <DrawerDescription>{project?.address || "No address provided"}</DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Contact</p>
            <p className="font-medium">
              {project?.last_contact_at 
                ? format(new Date(project.last_contact_at), "MMM d, yyyy 'at' h:mm a")
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Next Step</p>
            <p className="font-medium">{project?.next_step_title || "—"}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Due</p>
            <div className="font-medium">
              <Deadline dueAt={project?.next_step_due_at} />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
          
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">{getEventIcon(event.event_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {formatEventType(event.event_type)}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    {event.payload?.summary && (
                      <p className="text-sm text-muted-foreground mt-1">{event.payload.summary}</p>
                    )}
                    {event.payload?.note && (
                      <p className="text-sm text-muted-foreground mt-1">{event.payload.note}</p>
                    )}
                    {event.payload?.from && event.payload?.to && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Changed from <span className="font-medium">{event.payload.from}</span> to{" "}
                        <span className="font-medium">{event.payload.to}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex gap-2">
            <Button variant="default">Add Contact Log</Button>
            <Button variant="secondary">Update Next Step</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
