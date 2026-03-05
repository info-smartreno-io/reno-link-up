import { useState, useEffect } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, AlertCircle, FileText } from "lucide-react";

interface BidSubmission {
  id: string;
  bid_amount: number;
  status: string;
  submitted_at: string;
  proposal_text: string;
  estimated_timeline: string;
  reviewed_at: string | null;
  bid_opportunities: {
    title: string;
    project_type: string;
    location: string;
  } | null;
}

export default function EstimatorBidSubmissions() {
  const [submissions, setSubmissions] = useState<BidSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    awarded: 0,
    rejected: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bid_submissions")
        .select(`
          *,
          bid_opportunities (
            title,
            project_type,
            location
          )
        `)
        .eq("bidder_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const submitted = data?.filter(s => s.status === 'submitted').length || 0;
      const underReview = data?.filter(s => s.status === 'under_review').length || 0;
      const awarded = data?.filter(s => s.status === 'awarded').length || 0;
      const rejected = data?.filter(s => s.status === 'rejected').length || 0;

      setStats({ total, submitted, underReview, awarded, rejected });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load bid submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="default">
            <AlertCircle className="mr-1 h-3 w-3" />
            Under Review
          </Badge>
        );
      case 'awarded':
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Awarded
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <EstimatorLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </EstimatorLayout>
    );
  }

  return (
    <EstimatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Bid Submissions</h1>
          <p className="text-muted-foreground">
            Track the status of all your submitted bids
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awarded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.awarded}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bid submissions yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.bid_opportunities?.title || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {submission.bid_opportunities?.location || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {submission.bid_opportunities?.project_type || 'N/A'}
                      </TableCell>
                      <TableCell>
                        ${submission.bid_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {submission.estimated_timeline || '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.submitted_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </EstimatorLayout>
  );
}
