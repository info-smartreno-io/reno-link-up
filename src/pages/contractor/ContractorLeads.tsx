import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { RecordActivityDialog } from "@/components/leads/RecordActivityDialog";
import { LastActivityBadge } from "@/components/leads/LastActivityBadge";

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
  last_activity_at: string | null;
  last_activity_type: string | null;
  last_activity_by: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new_lead: { label: "New Lead", color: "bg-blue-500" },
  call_24h: { label: "24hr Call", color: "bg-yellow-500" },
  walkthrough: { label: "Walkthrough", color: "bg-purple-500" },
  scope_sent: { label: "Scope Sent", color: "bg-green-500" },
  scope_adjustment: { label: "Scope Adjust", color: "bg-orange-500" },
  bid_room: { label: "Bid Room", color: "bg-cyan-500" },
  bid_accepted: { label: "Bid Accepted", color: "bg-emerald-500" },
  on_hold: { label: "On Hold", color: "bg-amber-500" },
  lost: { label: "Lost", color: "bg-red-500" },
};

export default function ContractorLeads() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads, isLoading, error, refetch } = useQuery({
    queryKey: ["contractor-leads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch leads where user is the owner OR leads from their API keys
      const { data, error } = await supabase
        .from("leads")
        .select("*, last_activity_at, last_activity_type, last_activity_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.project_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Stats calculations
  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new_lead").length || 0,
    inProgress: leads?.filter((l) => 
      ["call_24h", "walkthrough", "scope_sent", "bid_room"].includes(l.status)
    ).length || 0,
    converted: leads?.filter((l) => l.status === "bid_accepted").length || 0,
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Manage leads from your partner integrations and referrals
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.converted}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, project type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load leads. Please try again.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No leads found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Leads from your partner integrations will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const status = statusConfig[lead.status] || {
                        label: lead.status,
                        color: "bg-gray-500",
                      };

                      return (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => navigate(`/contractor/leads/${lead.id}`)}
                        >
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {lead.email}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.project_type}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {lead.location || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <LastActivityBadge
                              activityType={lead.last_activity_type}
                              activityAt={lead.last_activity_at}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <RecordActivityDialog
                                leadId={lead.id}
                                leadName={lead.name}
                                onSuccess={() => refetch()}
                                triggerButton={
                                  <Button variant="outline" size="sm">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Log
                                  </Button>
                                }
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/contractor/leads/${lead.id}`);
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ContractorLayout>
  );
}
