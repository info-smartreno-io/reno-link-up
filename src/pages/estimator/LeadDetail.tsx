import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimatorTaskChecklist } from "@/components/estimator/EstimatorTaskChecklist";
import { ProposalsPanel } from "@/components/estimator/ProposalsPanel";
import { BlockersPanel } from "@/components/estimator/BlockersPanel";
import { SaleOutcomePanel } from "@/components/estimator/SaleOutcomePanel";
import { LeadActionButtons } from "@/components/leads/LeadActionButtons";
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  User,
  DollarSign,
  FileText,
  ExternalLink,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  project_type: string;
  status: string;
  stage: string | null;
  estimated_budget: string | null;
  client_notes: string | null;
  internal_notes: string | null;
  blocker_type: string | null;
  next_action: string | null;
  next_action_date: string | null;
  sale_outcome: string | null;
  estimator_readonly: boolean;
  created_at: string;
  user_id: string;
}

interface Walkthrough {
  id: string;
  date: string;
  time: string | null;
  status: string;
  project_name: string;
  address: string | null;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
  });

  const { data: walkthroughs = [] } = useQuery({
    queryKey: ["lead-walkthroughs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('walkthroughs')
        .select('id, date, time, status, project_name, address')
        .eq('lead_id', id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Walkthrough[];
    },
  });

  const { data: estimatorProfile } = useQuery({
    queryKey: ["estimator-profile", lead?.user_id],
    enabled: !!lead?.user_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', lead!.user_id)
        .single();
      return data;
    },
  });

  const isReadonly = lead?.estimator_readonly || false;

  if (leadLoading) {
    return (
      <EstimatorLayout>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </EstimatorLayout>
    );
  }

  if (!lead) {
    return (
      <EstimatorLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Lead not found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </EstimatorLayout>
    );
  }

  const googleMapsUrl = lead.location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.location)}`
    : null;

  return (
    <EstimatorLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Breadcrumbs />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <p className="text-muted-foreground">{lead.project_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isReadonly && (
              <Badge variant="secondary" className="text-sm">
                Read-only
              </Badge>
            )}
            <LeadActionButtons
              leadId={id!}
              leadName={lead.name}
              leadEmail={lead.email}
              leadLocation={lead.location}
              projectType={lead.project_type}
              estimatedBudget={lead.estimated_budget}
              saleOutcome={lead.sale_outcome}
              isReadonly={isReadonly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lead Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Homeowner:</span>
                      <span className="font-medium">{lead.name}</span>
                    </div>
                    {lead.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">Address:</span>
                        <div>
                          <span className="font-medium">{lead.location}</span>
                          {googleMapsUrl && (
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Map
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <a href={`mailto:${lead.email}`} className="font-medium text-primary hover:underline">
                          {lead.email}
                        </a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <a href={`tel:${lead.phone}`} className="font-medium text-primary hover:underline">
                          {lead.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Project Type:</span>
                      <Badge variant="outline">{lead.project_type}</Badge>
                    </div>
                    {lead.estimated_budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium">{lead.estimated_budget}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estimator:</span>
                      <span className="font-medium">{estimatorProfile?.full_name || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(lead.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>

                {/* Client Notes */}
                {lead.client_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Client Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {lead.client_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {walkthroughs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No appointments scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {walkthroughs.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-3 rounded-md border"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{w.project_name || "Walk-through"}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(w.date), "EEEE, MMMM d")}
                              {w.time && ` at ${w.time}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={w.status === 'scheduled' ? 'default' : 'secondary'}>
                          {w.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposals & Revisions */}
            <ProposalsPanel leadId={id!} isReadonly={isReadonly} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sale Outcome */}
            <SaleOutcomePanel 
              leadId={id!} 
              currentOutcome={lead.sale_outcome} 
              isReadonly={isReadonly}
            />

            {/* Task Checklist */}
            <EstimatorTaskChecklist leadId={id!} />

            {/* Blockers */}
            <BlockersPanel leadId={id!} isReadonly={isReadonly} />
          </div>
        </div>
      </div>
    </EstimatorLayout>
  );
}