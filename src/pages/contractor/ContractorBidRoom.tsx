import { useEffect, useState } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, DollarSign, MapPin, Building2, FileText, Send, Edit, MessageSquare } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import ContractorBidSubmissionDialog from "@/components/contractor/ContractorBidSubmissionDialog";
import { BidMessagingDialog } from "@/components/bid/BidMessagingDialog";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoBidOpportunities, getDemoBidSubmissions } from "@/utils/demoContractorData";

interface BidOpportunity {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  location: string;
  estimated_budget: number | null;
  square_footage: number | null;
  deadline: string | null;
  bid_deadline: string;
  requirements: any;
  created_at: string;
}

interface BidSubmission {
  id: string;
  bid_opportunity_id: string;
  bid_amount: number;
  estimated_timeline: string | null;
  proposal_text: string | null;
  status: string;
  submitted_at: string;
  attachments: any;
  bid_opportunities: {
    id: string;
    title: string;
    description: string | null;
    project_type: string;
    location: string;
    estimated_budget: number | null;
  };
}

export default function ContractorBidRoom() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<BidOpportunity[]>([]);
  const [submissions, setSubmissions] = useState<BidSubmission[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<BidOpportunity | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [selectedMessagingOpp, setSelectedMessagingOpp] = useState<BidOpportunity | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, set demo user and skip auth
      setUser({ id: "demo-user" } as User);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    // Demo mode - use demo data
    if (isDemoMode) {
      setOpportunities(getDemoBidOpportunities() as unknown as BidOpportunity[]);
      setSubmissions(getDemoBidSubmissions() as unknown as BidSubmission[]);
      setLoading(false);
      return;
    }

    const fetchOpportunities = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bid_opportunities')
          .select('*')
          .eq('status', 'open')
          .eq('open_to_contractors', true)
          .gte('bid_deadline', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        setOpportunities(data || []);
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

    const fetchSubmissions = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bid_submissions')
          .select(`
            *,
            bid_opportunities (
              id,
              title,
              description,
              project_type,
              location,
              estimated_budget
            )
          `)
          .eq('bidder_id', user.id)
          .eq('bidder_type', 'contractor')
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchOpportunities();
    fetchSubmissions();

    const opportunitiesChannel = supabase
      .channel('bid-opportunities-contractor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bid_opportunities',
        },
        () => {
          fetchOpportunities();
        }
      )
      .subscribe();

    const submissionsChannel = supabase
      .channel('bid-submissions-contractor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bid_submissions',
          filter: `bidder_id=eq.${user?.id}`,
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(opportunitiesChannel);
      supabase.removeChannel(submissionsChannel);
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
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleEdit = (submission: BidSubmission) => {
    if (submission.bid_opportunities) {
      setSelectedOpportunity({
        ...submission.bid_opportunities,
        square_footage: null,
        deadline: null,
        bid_deadline: new Date().toISOString(),
        requirements: [],
        created_at: new Date().toISOString(),
      });
      setSubmissionDialogOpen(true);
    }
  };

  const handleWithdraw = async (submissionId: string) => {
    if (!confirm("Are you sure you want to withdraw this bid?")) return;

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Bid withdrawal is simulated in demo mode.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bid_submissions')
        .update({ status: 'withdrawn' })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Bid Withdrawn",
        description: "Your bid has been withdrawn successfully.",
      });
    } catch (error) {
      console.error("Error withdrawing bid:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw bid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isDeadlineSoon = (deadline: string) => {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bid Room</h1>
          <p className="text-muted-foreground mt-1">
            Browse opportunities and manage your bid submissions
          </p>
        </div>

        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="opportunities">Available Opportunities</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="mt-6">
            {opportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No open bid opportunities at this time</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for new project opportunities
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                          <CardDescription className="mt-1">{opportunity.project_type}</CardDescription>
                        </div>
                        {isDeadlineSoon(opportunity.bid_deadline) && (
                          <Badge variant="destructive" className="ml-2">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {opportunity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {opportunity.location}
                        </div>

                        {opportunity.estimated_budget && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ${opportunity.estimated_budget.toLocaleString()} budget
                          </div>
                        )}

                        {opportunity.square_footage && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4 mr-2" />
                            {opportunity.square_footage.toLocaleString()} sq ft
                          </div>
                        )}

                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className={isDeadlineSoon(opportunity.bid_deadline) ? 'text-destructive font-medium' : ''}>
                            Bid by {new Date(opportunity.bid_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {opportunity.requirements && Array.isArray(opportunity.requirements) && opportunity.requirements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Requirements:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {opportunity.requirements.slice(0, 2).map((req: any, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span className="line-clamp-1">{req.text}</span>
                              </li>
                            ))}
                            {opportunity.requirements.length > 2 && (
                              <li className="text-xs italic">
                                +{opportunity.requirements.length - 2} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedMessagingOpp(opportunity);
                            setMessagingDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedOpportunity(opportunity);
                            setSubmissionDialogOpen(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bid submissions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submit proposals from the Available Opportunities tab
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {submission.bid_opportunities?.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {submission.bid_opportunities?.project_type} • {submission.bid_opportunities?.location}
                          </CardDescription>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">${submission.bid_amount.toLocaleString()}</span>
                        </div>
                        
                        {submission.estimated_timeline && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            {submission.estimated_timeline}
                          </div>
                        )}

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                        </div>
                      </div>

                      {submission.proposal_text && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {submission.proposal_text}
                          </p>
                        </div>
                      )}

                      {submission.attachments && Array.isArray(submission.attachments) && submission.attachments.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.attachments.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {(submission.status === 'submitted' || submission.status === 'under_review') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(submission)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWithdraw(submission.id)}
                            >
                              Withdraw
                            </Button>
                          </>
                        )}
                        {submission.status === 'accepted' && (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Accepted
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {user && (
        <>
          <ContractorBidSubmissionDialog
            open={submissionDialogOpen}
            onOpenChange={setSubmissionDialogOpen}
            opportunity={selectedOpportunity}
            contractorId={user.id}
          />
          
          {selectedMessagingOpp && (
            <BidMessagingDialog
              open={messagingDialogOpen}
              onOpenChange={setMessagingDialogOpen}
              opportunityId={selectedMessagingOpp.id}
              opportunityTitle={selectedMessagingOpp.title}
            />
          )}
        </>
      )}
      </div>
    </ContractorLayout>
  );
}
