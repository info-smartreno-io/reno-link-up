import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Wrench,
  Calendar,
  Home,
  User,
  MapPin,
  Loader2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoWarrantyClaims } from "@/utils/demoContractorData";

interface WarrantyClaim {
  id: string;
  claim_number: string;
  claim_status: string;
  priority: string;
  reported_issue_title: string;
  next_action: string | null;
  next_action_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  project_id: string;
  homeowner_id: string;
  contractor_id: string;
}

interface WarrantyEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  actor_role: string;
}

export default function ContractorWarrantyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [events, setEvents] = useState<WarrantyEvent[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClaimDetails();
    }
  }, [id, isDemoMode]);

  const fetchClaimDetails = async () => {
    if (isDemoMode) {
      const demoClaims = getDemoWarrantyClaims();
      const demoClaim = demoClaims.find(c => c.id === id) || demoClaims[0];
      if (demoClaim) {
        setClaim({
          id: demoClaim.id,
          claim_number: demoClaim.claim_number,
          claim_status: demoClaim.claim_status,
          priority: demoClaim.priority,
          reported_issue_title: demoClaim.reported_issue_title,
          next_action: "Schedule inspection visit",
          next_action_due_at: demoClaim.next_action_due_at,
          resolved_at: demoClaim.claim_status === 'resolved' ? new Date().toISOString() : null,
          created_at: demoClaim.created_at,
          project_id: demoClaim.project_id,
          homeowner_id: "demo-homeowner",
          contractor_id: "demo-contractor",
        });
        setEvents([
          {
            id: "event-1",
            event_type: "claim_created",
            message: "Warranty claim submitted by homeowner",
            created_at: demoClaim.created_at,
            actor_role: "homeowner",
          },
          {
            id: "event-2",
            event_type: "status_change",
            message: "Claim acknowledged by contractor",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            actor_role: "contractor",
          },
        ]);
      }
      setLoading(false);
      return;
    }

    try {
      const { data: claimData, error: claimError } = await supabase
        .from("warranty_claims")
        .select("*")
        .eq("id", id)
        .single();

      if (claimError) throw claimError;
      setClaim(claimData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("warranty_claim_events")
        .select("*")
        .eq("claim_id", id)
        .order("created_at", { ascending: false });

      if (!eventsError) {
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error("Error fetching warranty claim:", error);
      toast({
        title: "Error",
        description: "Failed to load warranty claim details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!claim) return;
    setSaving(true);
    
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Warranty claim marked as resolved (demo mode)",
      });
      navigate("/contractor/warranty");
      setSaving(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("warranty_claims")
        .update({
          claim_status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", claim.id);

      if (error) throw error;

      // Add event
      await supabase.from("warranty_claim_events").insert({
        claim_id: claim.id,
        event_type: "status_change",
        message: resolutionNotes || "Claim marked as resolved by contractor",
        actor_role: "contractor",
      });

      toast({
        title: "Success",
        description: "Warranty claim marked as resolved",
      });
      navigate("/contractor/warranty");
    } catch (error) {
      console.error("Error resolving claim:", error);
      toast({
        title: "Error",
        description: "Failed to resolve warranty claim",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: "outline" as const, icon: Clock, label: "Pending" },
      in_progress: { variant: "default" as const, icon: Wrench, label: "In Progress" },
      resolved: { variant: "secondary" as const, icon: CheckCircle, label: "Resolved" },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive" as const,
      medium: "default" as const,
      low: "secondary" as const,
    };
    return (
      <Badge variant={variants[priority as keyof typeof variants] || variants.medium}>
        {priority?.toUpperCase() || "MEDIUM"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  if (!claim) {
    return (
      <ContractorLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Warranty claim not found</p>
          <Button onClick={() => navigate("/contractor/warranty")} className="mt-4">
            Back to Warranty Claims
          </Button>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/warranty")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{claim.claim_number}</h1>
            <p className="text-muted-foreground">{claim.reported_issue_title}</p>
          </div>
          <div className="flex gap-2">
            {getPriorityBadge(claim.priority)}
            {getStatusBadge(claim.claim_status)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Issue</h4>
                  <p className="text-muted-foreground">{claim.reported_issue_title}</p>
                </div>
                {claim.next_action && (
                  <div>
                    <h4 className="font-medium mb-2">Next Action</h4>
                    <p className="text-muted-foreground">{claim.next_action}</p>
                    {claim.next_action_due_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {format(new Date(claim.next_action_due_at), "PPP")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No activity recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex gap-3 border-l-2 border-muted pl-4 pb-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{event.event_type.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">{event.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.created_at), "PPp")} • {event.actor_role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {claim.claim_status === "in_progress" && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolve Claim</CardTitle>
                  <CardDescription>Add resolution notes and mark this claim as resolved</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleMarkResolved} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Mark as Resolved
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Claim Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {format(new Date(claim.created_at), "PPP")}</span>
                </div>
                {claim.resolved_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Resolved: {format(new Date(claim.resolved_at), "PPP")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ContractorLayout>
  );
}
