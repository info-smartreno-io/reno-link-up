import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  internal_notes: string | null;
  client_notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new_lead: { label: "New Lead", color: "bg-blue-500" },
  call_24h: { label: "24hr Call", color: "bg-yellow-500" },
  walkthrough: { label: "Walkthrough Scheduled", color: "bg-purple-500" },
  scope_sent: { label: "Scope Sent", color: "bg-green-500" },
  scope_adjustment: { label: "Scope Adjustment", color: "bg-orange-500" },
  bid_room: { label: "In Bid Room", color: "bg-cyan-500" },
  bid_accepted: { label: "Bid Accepted", color: "bg-emerald-500" },
  on_hold: { label: "On Hold", color: "bg-amber-500" },
  lost: { label: "Lost", color: "bg-red-500" },
};

export default function ContractorLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["contractor-lead", id],
    queryFn: async () => {
      if (!id) throw new Error("Lead ID required");

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-lead", id] });
      queryClient.invalidateQueries({ queryKey: ["contractor-leads"] });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const existingNotes = lead?.internal_notes || "";
      const timestamp = format(new Date(), "MMM d, yyyy h:mm a");
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}]\n${note}`
        : `[${timestamp}]\n${note}`;

      const { error } = await supabase
        .from("leads")
        .update({ internal_notes: updatedNotes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-lead", id] });
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Your note has been added to the lead.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ContractorLayout>
    );
  }

  if (error || !lead) {
    return (
      <ContractorLayout>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load lead details.</p>
          <Button onClick={() => navigate("/contractor/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </ContractorLayout>
    );
  }

  const status = statusConfig[lead.status] || {
    label: lead.status,
    color: "bg-gray-500",
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.project_type}</p>
          </div>
          <Badge className={`${status.color} text-white px-3 py-1`}>
            {status.label}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {lead.email}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {lead.phone && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {lead.location && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {lead.location}
                    </p>
                  </div>
                )}
                {lead.estimated_budget && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Estimated Budget</Label>
                    <p className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {lead.estimated_budget}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes & Activity
                </CardTitle>
                <CardDescription>Add notes and track interactions with this lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Notes */}
                {lead.internal_notes && (
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                    {lead.internal_notes}
                  </div>
                )}

                <Separator />

                {/* Add Note Form */}
                <div className="space-y-3">
                  <Label>Add a Note</Label>
                  <Textarea
                    placeholder="Enter your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => addNoteMutation.mutate(newNote)}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={lead.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {updateStatusMutation.isPending && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating status...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                {lead.phone && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Lead
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/contractor/calendar")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>

            {/* Lead Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline">{lead.source || "Direct"}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(lead.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(lead.updated_at), "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ContractorLayout>
  );
}
