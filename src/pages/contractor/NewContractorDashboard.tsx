import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/context/DemoModeContext";
import { useContractorId } from "@/hooks/contractor/useContractorOnboarding";
import {
  Briefcase, DollarSign, FileText, MessageSquare, MapPin,
  Clock, ChevronRight, Bell, TrendingUp, AlertCircle
} from "lucide-react";

function useOpportunities(contractorId: string | undefined) {
  return useQuery({
    queryKey: ["contractor-opportunities", contractorId],
    enabled: !!contractorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("id, title, location, project_type, estimated_budget, bid_deadline, status")
        .eq("status", "open")
        .eq("open_to_contractors", true)
        .order("bid_deadline", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
  });
}

function useKPIs(contractorId: string | undefined) {
  return useQuery({
    queryKey: ["contractor-kpis", contractorId],
    enabled: !!contractorId,
    queryFn: async () => {
      const { count: opportunities } = await supabase
        .from("bid_opportunities")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .eq("open_to_contractors", true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { opportunities: 0, activeBids: 0, awardedProjects: 0, messages: 0 };

      const { count: activeBids } = await supabase
        .from("bid_submissions")
        .select("*", { count: "exact", head: true })
        .eq("bidder_id", user.id)
        .in("status", ["pending", "submitted", "shortlisted"]);

      const { count: awardedProjects } = await supabase
        .from("contractor_projects")
        .select("*", { count: "exact", head: true })
        .eq("contractor_id", contractorId!)
        .in("status", ["active", "in_progress"]);

      const { count: messages } = await supabase
        .from("contractor_messages")
        .select("*", { count: "exact", head: true })
        .eq("contractor_id", user.id)
        .eq("is_read", false);

      return {
        opportunities: opportunities || 0,
        activeBids: activeBids || 0,
        awardedProjects: awardedProjects || 0,
        messages: messages || 0,
      };
    },
  });
}

function useMyProjects(contractorId: string | undefined) {
  return useQuery({
    queryKey: ["contractor-my-projects", contractorId],
    enabled: !!contractorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("id, project_name, status, location, project_type, start_date")
        .eq("contractor_id", contractorId!)
        .in("status", ["active", "in_progress", "planning"])
        .order("start_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });
}

export default function NewContractorDashboard() {
  const navigate = useNavigate();
  const { data: contractorId, isLoading: idLoading } = useContractorId();
  const { data: opportunities, isLoading: oppsLoading } = useOpportunities(contractorId);
  const { data: kpis, isLoading: kpisLoading } = useKPIs(contractorId);
  const { data: projects, isLoading: projLoading } = useMyProjects(contractorId);

  const loading = idLoading || oppsLoading || kpisLoading;

  const kpiCards = [
    { label: "Matched Opportunities", value: kpis?.opportunities || 0, icon: Briefcase, color: "text-accent" },
    { label: "Active Bids", value: kpis?.activeBids || 0, icon: FileText, color: "text-accent" },
    { label: "Awarded Projects", value: kpis?.awardedProjects || 0, icon: TrendingUp, color: "text-accent" },
    { label: "Unread Messages", value: kpis?.messages || 0, icon: MessageSquare, color: "text-accent" },
  ];

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Your jobs at a glance.</p>
          </div>
        </div>

        {/* Today's Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Today's Opportunities
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/contractor/opportunities")}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : opportunities && opportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map(opp => {
                const daysLeft = Math.ceil((new Date(opp.bid_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Card key={opp.id} className="hover:border-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/contractor/rfp/${opp.id}`)}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary" className="text-xs">{opp.project_type}</Badge>
                        <Badge variant={daysLeft <= 2 ? "destructive" : "outline"} className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysLeft}d left
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground line-clamp-2">{opp.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {opp.location}
                      </div>
                      {opp.estimated_budget && (
                        <div className="flex items-center gap-1 text-sm text-foreground font-medium">
                          <DollarSign className="h-3.5 w-3.5" /> ${opp.estimated_budget.toLocaleString()}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">View Packet</Button>
                        <Button size="sm" className="flex-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90">Start Bid</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No open opportunities right now.</CardContent></Card>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  {kpisLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">My Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/contractor/projects")}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {projLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map(proj => (
                <Card key={proj.id} className="hover:border-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/contractor/projects/${proj.id}/overview`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{proj.project_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {proj.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{proj.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No active projects.</CardContent></Card>
          )}
        </div>
      </div>
    </ContractorLayout>
  );
}
