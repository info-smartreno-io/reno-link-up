import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadScore } from "./LeadScore";
import { Download, Trophy, Medal, Award, Filter, Search, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  lead_score?: number;
  score_budget?: number;
  score_response_time?: number;
  score_stage_progression?: number;
  last_contact_date?: string | null;
  contact_count?: number;
  created_at: string;
}

const stageNames: Record<string, string> = {
  new_lead: "New Lead",
  call_24h: "24hr Call",
  walkthrough: "Walkthrough",
  scope_sent: "Scope Sent",
  scope_adjustment: "Scope Adjustment",
  architectural_design: "Architectural/Design",
  bid_room: "Bid Room",
  smart_bid_3: "3SmartBid",
  bid_accepted: "Bid Accepted",
};

export function LeadLeaderboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchQuery, stageFilter, scoreFilter, dateFilter]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.project_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === stageFilter);
    }

    // Score filter
    if (scoreFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const score = lead.lead_score || 0;
        switch (scoreFilter) {
          case "hot":
            return score >= 80;
          case "warm":
            return score >= 60 && score < 80;
          case "cool":
            return score >= 40 && score < 60;
          case "cold":
            return score < 40;
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((lead) => {
        const createdDate = new Date(lead.created_at);
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "quarter":
            return daysDiff <= 90;
          default:
            return true;
        }
      });
    }

    setFilteredLeads(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Score",
      "Name",
      "Email",
      "Phone",
      "Project Type",
      "Location",
      "Stage",
      "Budget",
      "Budget Score",
      "Response Score",
      "Progression Score",
      "Contacts",
      "Last Contact",
      "Created Date",
    ];

    const rows = filteredLeads.map((lead, index) => [
      index + 1,
      lead.lead_score || 0,
      lead.name,
      lead.email,
      lead.phone,
      lead.project_type,
      lead.location,
      stageNames[lead.status] || lead.status,
      lead.estimated_budget || "TBD",
      lead.score_budget || 0,
      lead.score_response_time || 0,
      lead.score_stage_progression || 0,
      lead.contact_count || 0,
      lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleString() : "Never",
      new Date(lead.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lead-leaderboard-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${filteredLeads.length} leads to CSV`,
    });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <Award className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return <div className="p-6">Loading leaderboard...</div>;
  }

  const topStats = {
    avgScore: filteredLeads.length > 0
      ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / filteredLeads.length)
      : 0,
    hotLeads: filteredLeads.filter((l) => (l.lead_score || 0) >= 80).length,
    totalValue: filteredLeads.reduce((sum, l) => {
      const budget = l.estimated_budget || "";
      const match = budget.match(/\$([0-9,]+)/);
      if (match) {
        return sum + parseInt(match[1].replace(/,/g, ""));
      }
      return sum;
    }, 0),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Lead Leaderboard
            </CardTitle>
            <CardDescription>
              Top-performing leads ranked by score
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{topStats.avgScore}</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {topStats.hotLeads}
                </div>
                <div className="text-sm text-muted-foreground">Hot Leads (80+)</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ${(topStats.totalValue / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(stageNames).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger>
              <Award className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="hot">🔥 Hot (80+)</SelectItem>
              <SelectItem value="warm">🌡️ Warm (60-79)</SelectItem>
              <SelectItem value="cool">❄️ Cool (40-59)</SelectItem>
              <SelectItem value="cold">🧊 Cold (&lt;40)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Lead Info</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead, index) => (
                  <TableRow key={lead.id} className={index < 3 ? "bg-muted/30" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
                        <span className="font-semibold">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <LeadScore
                        score={lead.lead_score || 0}
                        budgetScore={lead.score_budget || 0}
                        responseScore={lead.score_response_time || 0}
                        progressionScore={lead.score_stage_progression || 0}
                        variant="compact"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                        <div className="text-xs text-muted-foreground">{lead.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lead.project_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stageNames[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.estimated_budget || "TBD"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <div className="font-semibold">{lead.contact_count || 0}</div>
                        {lead.last_contact_date && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(lead.last_contact_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {filteredLeads.length} of {leads.length} total leads
        </div>
      </CardContent>
    </Card>
  );
}
