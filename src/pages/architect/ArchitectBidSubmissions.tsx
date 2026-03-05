import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, DollarSign, Calendar, Edit, Eye } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import ArchitectBidSubmissionDialog from "@/components/architect/ArchitectBidSubmissionDialog";

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

export default function ArchitectBidSubmissions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<BidSubmission[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<BidSubmission | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
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
          .eq('bidder_type', 'architect')
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        toast({
          title: "Error",
          description: "Failed to load your bid submissions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('bid-submissions')
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
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleEdit = (submission: BidSubmission) => {
    setSelectedSubmission(submission);
    setSelectedOpportunity(submission.bid_opportunities);
    setEditDialogOpen(true);
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Are you sure you want to withdraw this bid?")) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/projects')}>
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/proposals')}>
                Proposals
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/bid-room')}>
                Bid Room
              </Button>
              <Button variant="default" size="sm">
                My Bids
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/messages')}>
                Messages
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bid Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your submitted proposals
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bid submissions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Visit the Bid Room to submit proposals for available opportunities
              </p>
              <Button className="mt-4" onClick={() => navigate('/architect/bid-room')}>
                Browse Bid Room
              </Button>
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
                          onClick={() => handleDelete(submission.id)}
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
      </div>

      {user && selectedOpportunity && (
        <ArchitectBidSubmissionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          opportunity={selectedOpportunity}
          architectId={user.id}
        />
      )}
    </div>
  );
}
