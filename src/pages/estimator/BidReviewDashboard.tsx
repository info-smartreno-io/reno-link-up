import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, DollarSign, ArrowLeft, Users, CheckCircle, XCircle, Search, Filter, ArrowUpDown, GitCompare, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BidComparisonMatrix } from "@/components/bid/BidComparisonMatrix";
import { generateDemoKitchenRemodel, generateDemoBathroomRemodel } from "@/utils/demoData";

interface BidOpportunity {
  id: string;
  title: string;
  project_type: string;
  location: string;
  status: string;
  bid_deadline: string;
  created_at: string;
  project_id?: string | null;
  bid_submissions: BidSubmission[];
}

interface BidSubmission {
  id: string;
  bidder_id: string;
  bidder_type: string;
  bid_amount: number;
  estimated_timeline: string | null;
  proposal_text: string | null;
  status: string;
  submitted_at: string;
  attachments: any;
  years_in_business?: number;
  crew_size?: number;
  has_project_manager?: boolean;
  platform_ratings?: any;
  overall_rating?: number;
  anticipated_start_date?: string;
  project_duration_weeks?: number;
  insurance_verified?: boolean;
  workers_comp_verified?: boolean;
  license_verified?: boolean;
  warranty_years?: number;
  warranty_terms?: string;
  references_count?: number;
  portfolio_projects_count?: number;
  certifications?: any;
  profiles?: {
    full_name: string;
  };
}

export default function BidReviewDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<BidOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<BidOpportunity | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedBids, setSelectedBids] = useState<BidSubmission[]>([]);
  const [matrixDialogOpen, setMatrixDialogOpen] = useState(false);
  const [selectedOpportunityForMatrix, setSelectedOpportunityForMatrix] =
    useState<BidOpportunity | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bidderTypeFilter, setBidderTypeFilter] = useState<string>("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/estimator/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/estimator/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bid_opportunities')
          .select(`
            *,
            bid_submissions (
              *,
              profiles:bidder_id (
                full_name
              )
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setOpportunities(data as any || []);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
        toast({
          title: "Error",
          description: "Failed to load bid opportunities.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();

    const channel = supabase
      .channel('bid-review')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bid_submissions',
        },
        () => {
          fetchOpportunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { variant: "default" as const, label: "Submitted" },
      under_review: { variant: "secondary" as const, label: "Under Review" },
      accepted: { variant: "default" as const, label: "Accepted" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      withdrawn: { variant: "outline" as const, label: "Withdrawn" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const isAccepted = status === 'accepted';
    
    return (
      <Badge variant={config.variant} className={isAccepted ? 'bg-green-500' : ''}>
        {config.label}
      </Badge>
    );
  };

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bid_submissions')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Bid has been ${newStatus}.`,
      });

      // Refresh data
      const { data } = await supabase
        .from('bid_opportunities')
        .select(`
          *,
          bid_submissions (*)
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      setOpportunities(data as any || []);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update bid status.",
        variant: "destructive",
      });
    }
  };

  const handleCompare = (opportunity: BidOpportunity) => {
    setSelectedOpportunity(opportunity);
    setSelectedBids(opportunity.bid_submissions.slice(0, 3));
    setCompareDialogOpen(true);
  };

  const handleShowMatrix = (opportunity: BidOpportunity) => {
    setSelectedOpportunityForMatrix(opportunity);
    setIsDemoMode(false);
    setDemoData(null);
    setMatrixDialogOpen(true);
  };

  const handleShowDemoKitchen = () => {
    const demo = generateDemoKitchenRemodel();
    setDemoData(demo);
    setIsDemoMode(true);
    setMatrixDialogOpen(true);
  };

  const handleShowDemoBathroom = () => {
    const demo = generateDemoBathroomRemodel();
    setDemoData(demo);
    setIsDemoMode(true);
    setMatrixDialogOpen(true);
  };

  // Get unique project types from opportunities
  const projectTypes = Array.from(new Set(opportunities.map(o => o.project_type)));

  // Filter and sort opportunities
  const filteredOpportunities = opportunities.filter(opportunity => {
    // Search filter
    if (searchQuery && !opportunity.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Project type filter
    if (projectTypeFilter !== "all" && opportunity.project_type !== projectTypeFilter) {
      return false;
    }

    // For bidder type and status filters, check submissions
    if (bidderTypeFilter !== "all" || statusFilter !== "all") {
      const hasMatchingSubmission = opportunity.bid_submissions.some(sub => {
        const matchesBidderType = bidderTypeFilter === "all" || sub.bidder_type === bidderTypeFilter;
        const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
        return matchesBidderType && matchesStatus;
      });
      
      if (!hasMatchingSubmission) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "date_desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "bids_desc":
        return b.bid_submissions.length - a.bid_submissions.length;
      case "bids_asc":
        return a.bid_submissions.length - b.bid_submissions.length;
      case "deadline_asc":
        return new Date(a.bid_deadline).getTime() - new Date(b.bid_deadline).getTime();
      default:
        return 0;
    }
  });

  // Filter submissions within each opportunity
  const filterOpportunitySubmissions = (opportunity: BidOpportunity) => {
    return opportunity.bid_submissions.filter(sub => {
      const matchesBidderType = bidderTypeFilter === "all" || sub.bidder_type === bidderTypeFilter;
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      return matchesBidderType && matchesStatus;
    }).sort((a, b) => {
      if (sortBy.includes("amount")) {
        return sortBy === "amount_desc" 
          ? b.bid_amount - a.bid_amount 
          : a.bid_amount - b.bid_amount;
      }
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/estimator/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Bid Review Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Review and manage all bid submissions for your opportunities
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShowDemoKitchen} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Demo: Kitchen
              </Button>
              <Button variant="outline" onClick={handleShowDemoBathroom} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Demo: Bathroom
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bid opportunities created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Send projects to the bid room to start receiving proposals
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters & Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Opportunities</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Bid Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bidder Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="bidderType">Bidder Type</Label>
                <Select value={bidderTypeFilter} onValueChange={setBidderTypeFilter}>
                  <SelectTrigger id="bidderType">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="architect">Architects</SelectItem>
                    <SelectItem value="contractor">Contractors</SelectItem>
                    <SelectItem value="interior_designer">Interior Designers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                  <SelectTrigger id="projectType">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projectTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-3 w-3" />
                        Newest First
                      </div>
                    </SelectItem>
                    <SelectItem value="date_asc">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-3 w-3" />
                        Oldest First
                      </div>
                    </SelectItem>
                    <SelectItem value="bids_desc">Most Bids</SelectItem>
                    <SelectItem value="bids_asc">Fewest Bids</SelectItem>
                    <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
                    <SelectItem value="amount_desc">Highest Bid Amount</SelectItem>
                    <SelectItem value="amount_asc">Lowest Bid Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setBidderTypeFilter("all");
                    setProjectTypeFilter("all");
                    setSortBy("date_desc");
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredOpportunities.length} of {opportunities.length} opportunities
        </div>

        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No opportunities match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOpportunities.map((opportunity) => {
              const displayedSubmissions = filterOpportunitySubmissions(opportunity);
              
              return (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {opportunity.project_type} • {opportunity.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={opportunity.status === 'open' ? 'default' : 'outline'}>
                        {opportunity.status}
                      </Badge>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {opportunity.bid_submissions.length} Bids
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Bid deadline: {new Date(opportunity.bid_deadline).toLocaleDateString()}
                    </div>
                  </div>

                  {displayedSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No submissions match your filters
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bidder</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Bid Amount</TableHead>
                            <TableHead>Timeline</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedSubmissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">
                                Bidder {submission.bidder_id.substring(0, 8)}
                              </TableCell>
                              <TableCell className="capitalize">{submission.bidder_type.replace('_', ' ')}</TableCell>
                              <TableCell className="font-semibold">
                                ${submission.bid_amount.toLocaleString()}
                              </TableCell>
                              <TableCell>{submission.estimated_timeline || 'N/A'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{getStatusBadge(submission.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {(submission.status === 'submitted' || submission.status === 'under_review') && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate(submission.id, 'accepted')}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {displayedSubmissions.length > 1 && (
                        <div className="mt-4 flex justify-end gap-2">
                          <Button variant="outline" onClick={() => handleCompare(opportunity)}>
                            Compare Bids
                          </Button>
                          <Button onClick={() => handleShowMatrix(opportunity)}>
                            <GitCompare className="h-4 w-4 mr-2" />
                            Comparison Matrix
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Bids - {selectedOpportunity?.title}</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of bid submissions
            </DialogDescription>
          </DialogHeader>

          {selectedBids.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBids.map((bid) => (
                <Card key={bid.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Bidder {bid.bidder_id.substring(0, 8)}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {bid.bidder_type.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Bid Amount</div>
                      <div className="text-2xl font-bold text-primary">
                        ${bid.bid_amount.toLocaleString()}
                      </div>
                    </div>

                    {bid.estimated_timeline && (
                      <div>
                        <div className="text-sm text-muted-foreground">Timeline</div>
                        <div className="font-medium">{bid.estimated_timeline}</div>
                      </div>
                    )}

                    {bid.proposal_text && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Proposal</div>
                        <p className="text-sm line-clamp-4">{bid.proposal_text}</p>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      {getStatusBadge(bid.status)}
                    </div>

                    {bid.attachments && Array.isArray(bid.attachments) && bid.attachments.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Attachments</div>
                        <div className="flex flex-wrap gap-1">
                          {bid.attachments.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              File {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {(bid.status === 'submitted' || bid.status === 'under_review') && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            handleStatusUpdate(bid.id, 'accepted');
                            setCompareDialogOpen(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            handleStatusUpdate(bid.id, 'rejected');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid Comparison Matrix Dialog */}
      <Dialog open={matrixDialogOpen} onOpenChange={setMatrixDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isDemoMode ? "Demo: " : ""}Bid Comparison Matrix
            </DialogTitle>
            {isDemoMode && (
              <p className="text-sm text-muted-foreground">
                This is a demonstration showing how bid comparisons work. Real data will appear here when you have actual bid submissions.
              </p>
            )}
          </DialogHeader>
          {isDemoMode && demoData ? (
            <BidComparisonMatrix
              bids={demoData.bids}
              opportunityTitle={demoData.opportunityTitle}
              opportunityId={demoData.opportunityId}
              projectId={demoData.projectId}
            />
          ) : selectedOpportunityForMatrix ? (
            <BidComparisonMatrix
              bids={selectedOpportunityForMatrix.bid_submissions}
              opportunityTitle={selectedOpportunityForMatrix.title}
              opportunityId={selectedOpportunityForMatrix.id}
              projectId={selectedOpportunityForMatrix.project_id}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
