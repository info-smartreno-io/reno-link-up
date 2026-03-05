import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoWarrantyClaims } from "@/utils/demoContractorData";
import { ScheduleVisitDialog } from "@/components/contractor/ScheduleVisitDialog";
import { ResolveClaimDialog } from "@/components/contractor/ResolveClaimDialog";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Calendar,
  Home,
  Wrench,
  Loader2,
} from "lucide-react";

interface WarrantyClaim {
  id: string;
  claim_number: string;
  claim_status: string;
  priority: string;
  reported_issue_title: string;
  next_action_due_at: string | null;
  created_at: string;
  project_id: string;
}

export default function ContractorWarranty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else {
      checkAuth();
      fetchClaims();
    }
  }, [isDemoMode]);

  const loadDemoData = () => {
    const demoClaims = getDemoWarrantyClaims();
    setClaims(demoClaims);
    setLoading(false);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && !isDemoMode) {
      navigate("/contractor/auth");
    }
  };

  const fetchClaims = async () => {
    if (isDemoMode) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("warranty_claims")
        .select("id, claim_number, claim_status, priority, reported_issue_title, next_action_due_at, created_at, project_id")
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching warranty claims:", error);
      toast({
        title: "Error",
        description: "Failed to load warranty claims",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisit = async (date: Date, notes: string) => {
    if (!selectedClaim) return;
    
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Visit scheduled (not saved in demo)" });
      setScheduleDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("warranty_claims")
        .update({
          claim_status: "in_progress",
          next_action: `Visit scheduled: ${notes || "Service visit"}`,
          next_action_due_at: date.toISOString(),
        })
        .eq("id", selectedClaim.id);

      if (error) throw error;

      await supabase.from("warranty_claim_events").insert({
        claim_id: selectedClaim.id,
        event_type: "visit_scheduled",
        message: `Visit scheduled for ${date.toLocaleDateString()}. ${notes}`,
        actor_role: "contractor",
      });

      toast({ title: "Success", description: "Visit scheduled successfully" });
      fetchClaims();
    } catch (error) {
      console.error("Error scheduling visit:", error);
      toast({ title: "Error", description: "Failed to schedule visit", variant: "destructive" });
    }
  };

  const handleResolveClaim = async (notes: string) => {
    if (!selectedClaim) return;
    
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Claim resolved (not saved in demo)" });
      setResolveDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("warranty_claims")
        .update({
          claim_status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedClaim.id);

      if (error) throw error;

      await supabase.from("warranty_claim_events").insert({
        claim_id: selectedClaim.id,
        event_type: "status_change",
        message: notes || "Claim resolved by contractor",
        actor_role: "contractor",
      });

      toast({ title: "Success", description: "Claim marked as resolved" });
      fetchClaims();
    } catch (error) {
      console.error("Error resolving claim:", error);
      toast({ title: "Error", description: "Failed to resolve claim", variant: "destructive" });
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = 
      claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.reported_issue_title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      (activeTab === "pending" && claim.claim_status === "pending") ||
      (activeTab === "in_progress" && claim.claim_status === "in_progress") ||
      (activeTab === "resolved" && claim.claim_status === "resolved") ||
      activeTab === "all";

    return matchesSearch && matchesTab;
  });

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
        {(priority || "medium").toUpperCase()}
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

  const stats = {
    pending: claims.filter(c => c.claim_status === "pending").length,
    inProgress: claims.filter(c => c.claim_status === "in_progress").length,
    resolved: claims.filter(c => c.claim_status === "resolved").length,
    total: claims.length,
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Warranty & Service</h1>
          <p className="text-muted-foreground">Manage warranty claims and service requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by claim number or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {filteredClaims.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No warranty claims found</p>
                </CardContent>
              </Card>
            ) : (
              filteredClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{claim.reported_issue_title}</CardTitle>
                        <CardDescription>{claim.claim_number}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getPriorityBadge(claim.priority)}
                        {getStatusBadge(claim.claim_status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                    {claim.next_action_due_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled: {new Date(claim.next_action_due_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => navigate(`/contractor/warranty/${claim.id}`)}>
                        View Details
                      </Button>
                      {claim.claim_status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedClaim(claim);
                          setScheduleDialogOpen(true);
                        }}>
                          Schedule Visit
                        </Button>
                      )}
                      {claim.claim_status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedClaim(claim);
                          setResolveDialogOpen(true);
                        }}>
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleVisitDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={handleScheduleVisit}
        claimNumber={selectedClaim?.claim_number || ""}
      />

      <ResolveClaimDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        onResolve={handleResolveClaim}
        claimNumber={selectedClaim?.claim_number || ""}
      />
    </ContractorLayout>
  );
}
