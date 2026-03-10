import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Award,
  Star,
  Users,
  Calendar,
  Shield,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface BidData {
  id: string;
  professional: string;
  bidderType: string;
  score: number;
  bidAmount: number;
  rating: number;
  yearsInBusiness: number;
  crewSize: number;
  hasProjectManager: boolean;
  anticipatedStartDate: string;
  projectDurationWeeks: number;
  insuranceVerified: boolean;
  workersCompVerified: boolean;
  licenseVerified: boolean;
  warrantyYears: number;
  warrantyTerms: string;
  portfolioProjectsCount: number;
  referencesCount: number;
  estimatorNotes?: string;
  estimatorRecommendation?: string;
}

interface BidComparisonReport {
  id: string;
  bid_opportunity_id: string;
  project_id: string | null;
  created_at: string;
  created_by: string;
  report_data: {
    opportunityTitle: string;
    generatedAt: string;
    topThree: BidData[];
    allBids: Array<{
      id: string;
      professional: string;
      score: number;
      bidAmount: number;
    }>;
  };
  status: string;
  homeowner_viewed_at: string | null;
  homeowner_notes: string | null;
  homeowner_selection: string | null;
  preferred_bid_id: string | null;
  estimator_recommendation: string | null;
}

export function BidComparisonReview({ projectId }: { projectId: string }) {
  const [reports, setReports] = useState<BidComparisonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BidComparisonReport | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    markAsViewed();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("bid_comparison_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports((data as any) || []);
      if (data && data.length > 0) {
        setSelectedReport(data[0] as any);
        setNotes((data[0] as any).homeowner_notes || "");
        setSelectedBid((data[0] as any).homeowner_selection || null);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load bid comparisons");
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async () => {
    try {
      const { data, error } = await supabase
        .from("bid_comparison_reports")
        .select("id, homeowner_viewed_at")
        .eq("project_id", projectId)
        .is("homeowner_viewed_at", null);

      if (error) throw error;

      if (data && data.length > 0) {
        await supabase
          .from("bid_comparison_reports")
          .update({ homeowner_viewed_at: new Date().toISOString() })
          .in(
            "id",
            data.map((r) => r.id)
          );
      }
    } catch (error) {
      console.error("Error marking as viewed:", error);
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedReport || !selectedBid) {
      toast.error("Please select a bid first");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedBidData = selectedReport.report_data.topThree.find(
        (b: BidData) => b.id === selectedBid
      );

      const { data: estimatorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', selectedReport.created_by)
        .single();

      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;
      
      const estimatorAuth = usersData?.users?.find((u: any) => u.id === selectedReport.created_by);
      const estimatorEmail = estimatorAuth?.email;

      const { data: homeownerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from("bid_comparison_reports")
        .update({
          homeowner_selection: selectedBid,
          homeowner_notes: notes,
          status: "completed",
          homeowner_viewed_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.id);

      if (error) throw error;

      // Send notification if email is available
      if (estimatorEmail && selectedBidData) {
        await supabase.functions.invoke('send-contractor-selection', {
          body: {
            estimatorId: selectedReport.created_by,
            estimatorEmail: estimatorEmail,
            estimatorName: estimatorProfile?.full_name || 'Construction Agent',
            homeownerName: homeownerProfile?.full_name || 'Homeowner',
            projectName: selectedReport.report_data.opportunityTitle,
            contractorName: selectedBidData.professional,
            bidAmount: selectedBidData.bidAmount,
            reportId: selectedReport.id,
            homeownerNotes: notes
          }
        });
      }

      toast.success("Your selection has been saved!");
      fetchReports();
    } catch (error) {
      console.error("Error saving selection:", error);
      toast.error("Failed to save selection");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading bid comparisons...</p>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No bid comparisons available yet. Your Construction Agent will send options for your review.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedReport) return null;

  const { report_data } = selectedReport;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{report_data.opportunityTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated on{" "}
                {new Date(report_data.generatedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant={selectedReport.status === "reviewed" ? "default" : "secondary"}
            >
              {selectedReport.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your Construction Agent has prepared a comparison of the top {report_data.topThree.length} bids for
            your project. Review the options below and select your preferred contractor.
          </p>
          {selectedReport.estimator_recommendation && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="font-semibold text-sm mb-2">Construction Agent's Recommendation:</p>
              <p className="text-sm">{selectedReport.estimator_recommendation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Bids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {report_data.topThree.map((bid, index) => {
          const isSelected = selectedBid === bid.id;
          const isPreferred = selectedReport.preferred_bid_id === bid.id;
          const ranks = ["🥇 Top Pick", "🥈 Runner Up", "🥉 Third Place"];

          return (
            <Card
              key={bid.id}
              className={`cursor-pointer transition-all relative ${
                isSelected
                  ? "border-primary border-2 shadow-lg"
                  : "hover:border-primary/50"
              } ${isPreferred ? "ring-2 ring-green-500" : ""}`}
              onClick={() => setSelectedBid(bid.id)}
            >
              {isPreferred && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-green-600 shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Construction Agent's Choice
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {ranks[index]}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-bold text-lg">{bid.score}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{bid.professional}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {bid.bidderType.replace("_", " ")}
                </p>
                {bid.estimatorRecommendation && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                      {bid.estimatorRecommendation}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-muted-foreground">Bid Amount</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(bid.bidAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {bid.rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="font-semibold">{bid.yearsInBusiness} years</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crew Size</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">{bid.crewSize}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Project Manager</span>
                  {bid.hasProjectManager ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <span className="text-sm">No</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Can Start</span>
                  <span className="text-sm">
                    {bid.anticipatedStartDate
                      ? new Date(bid.anticipatedStartDate).toLocaleDateString()
                      : "TBD"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm">{bid.projectDurationWeeks} weeks</span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Verifications</p>
                  <div className="flex gap-2">
                    {bid.insuranceVerified && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Insured
                      </Badge>
                    )}
                    {bid.workersCompVerified && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Workers Comp
                      </Badge>
                    )}
                    {bid.licenseVerified && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Licensed
                      </Badge>
                    )}
                  </div>
                </div>

                {bid.warrantyYears && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Warranty</p>
                    <p className="font-semibold">{bid.warrantyYears} years</p>
                    {bid.warrantyTerms && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {bid.warrantyTerms}
                      </p>
                    )}
                  </div>
                )}

                {isSelected && (
                  <div className="pt-2 mt-2 border-t">
                    <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
                    <p className="text-center text-sm font-medium text-primary mt-1">
                      Selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes and Submit */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">
              Notes or Questions for Your Estimator (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any questions, concerns, or preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSaveSelection} disabled={!selectedBid} className="flex-1">
              Save My Selection
            </Button>
            {selectedBid && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBid(null);
                  setNotes("");
                }}
              >
                Clear Selection
              </Button>
            )}
          </div>

          {selectedReport.status === "reviewed" && selectedReport.homeowner_selection && (
            <p className="text-sm text-center text-muted-foreground">
              ✓ You selected this option on{" "}
              {selectedReport.homeowner_viewed_at
                ? new Date(selectedReport.homeowner_viewed_at).toLocaleDateString()
                : "N/A"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
