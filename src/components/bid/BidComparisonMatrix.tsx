import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  Star,
  TrendingUp,
  Award,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Send,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BidSubmission {
  id: string;
  bidder_id: string;
  bid_amount: number;
  estimated_timeline?: string | null;
  years_in_business?: number | null;
  crew_size?: number | null;
  has_project_manager?: boolean | null;
  platform_ratings?: {
    google?: number;
    yelp?: number;
    angi?: number;
    houzz?: number;
  } | null;
  overall_rating?: number | null;
  anticipated_start_date?: string | null;
  project_duration_weeks?: number | null;
  insurance_verified?: boolean | null;
  workers_comp_verified?: boolean | null;
  license_verified?: boolean | null;
  warranty_years?: number | null;
  warranty_terms?: string | null;
  references_count?: number | null;
  portfolio_projects_count?: number | null;
  certifications?: Array<{ name: string; issuer: string; year: number }> | null;
  bidder_type: string;
  status: string;
  estimator_notes?: string | null;
  estimator_recommendation?: string | null;
  profiles?: {
    full_name: string;
  } | null;
}

interface BidComparisonMatrixProps {
  bids: BidSubmission[];
  opportunityTitle: string;
  opportunityId: string;
  projectId?: string | null;
}

type SortField =
  | "score"
  | "bid_amount"
  | "overall_rating"
  | "years_in_business"
  | "crew_size"
  | "anticipated_start_date";

export function BidComparisonMatrix({
  bids,
  opportunityTitle,
  opportunityId,
  projectId,
}: BidComparisonMatrixProps) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSending, setIsSending] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedBidForNotes, setSelectedBidForNotes] = useState<BidSubmission | null>(null);
  const [estimatorNotes, setEstimatorNotes] = useState("");
  const [estimatorRecommendation, setEstimatorRecommendation] = useState("");
  const [preferredBidId, setPreferredBidId] = useState<string | null>(null);
  const [overallRecommendation, setOverallRecommendation] = useState("");

  // Calculate comprehensive score for each bid
  const calculateBidScore = (bid: BidSubmission): number => {
    let score = 0;

    // Rating (0-25 points) - 25% weight
    score += (bid.overall_rating || 0) * 5;

    // Experience (0-20 points) - 20% weight
    const yearsScore = Math.min((bid.years_in_business || 0) / 20 * 20, 20);
    score += yearsScore;

    // Team capacity (0-15 points) - 15% weight
    const crewScore = Math.min((bid.crew_size || 0) / 10 * 15, 15);
    score += crewScore;

    // Project manager (0-10 points) - 10% weight
    if (bid.has_project_manager) score += 10;

    // Verifications (0-15 points) - 15% weight
    if (bid.insurance_verified) score += 5;
    if (bid.workers_comp_verified) score += 5;
    if (bid.license_verified) score += 5;

    // Warranty (0-10 points) - 10% weight
    score += Math.min((bid.warranty_years || 0) * 2, 10);

    // Portfolio & References (0-5 points) - 5% weight
    const portfolioScore = Math.min((bid.portfolio_projects_count || 0) / 20 * 2.5, 2.5);
    const refScore = Math.min((bid.references_count || 0) / 10 * 2.5, 2.5);
    score += portfolioScore + refScore;

    return Math.round(score * 10) / 10;
  };

  // Get top 3 bids based on score
  const rankedBids = useMemo(() => {
    const bidsWithScores = bids.map((bid) => ({
      ...bid,
      score: calculateBidScore(bid),
    }));

    return bidsWithScores.sort((a, b) => {
      if (sortField === "score") {
        return sortDirection === "desc" ? b.score - a.score : a.score - b.score;
      }
      
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      
      if (sortField === "bid_amount" || sortField === "anticipated_start_date") {
        return sortDirection === "asc" 
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      }
      
      return sortDirection === "desc"
        ? (bValue > aValue ? 1 : -1)
        : (aValue > bValue ? 1 : -1);
    });
  }, [bids, sortField, sortDirection]);

  const topThree = rankedBids.slice(0, 3);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getBestValue = (field: keyof BidSubmission, isLowerBetter = false) => {
    const values = rankedBids
      .map((bid) => bid[field])
      .filter((val) => val != null) as number[];
    
    if (values.length === 0) return null;
    
    return isLowerBetter ? Math.min(...values) : Math.max(...values);
  };

  const isHighlighted = (bid: BidSubmission, field: keyof BidSubmission, isLowerBetter = false) => {
    const bestValue = getBestValue(field, isLowerBetter);
    if (bestValue === null) return false;
    return bid[field] === bestValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankBadge = (index: number) => {
    const ranks = [
      { label: "🥇 Top Pick", variant: "default" as const },
      { label: "🥈 Runner Up", variant: "secondary" as const },
      { label: "🥉 Third Place", variant: "outline" as const },
    ];
    return ranks[index];
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Professional",
      "Type",
      "Score",
      "Bid Amount",
      "Rating",
      "Experience (Years)",
      "Crew Size",
      "Project Manager",
      "Start Date",
      "Duration (Weeks)",
      "Insurance",
      "Workers Comp",
      "License",
      "Warranty (Years)",
      "Portfolio Projects",
      "References",
    ];

    const rows = rankedBids.map((bid, index) => [
      index + 1,
      bid.profiles?.full_name || "Professional",
      bid.bidder_type.replace("_", " "),
      bid.score,
      bid.bid_amount,
      bid.overall_rating || "N/A",
      bid.years_in_business || 0,
      bid.crew_size || 0,
      bid.has_project_manager ? "Yes" : "No",
      bid.anticipated_start_date
        ? new Date(bid.anticipated_start_date).toLocaleDateString()
        : "TBD",
      bid.project_duration_weeks || "N/A",
      bid.insurance_verified ? "Yes" : "No",
      bid.workers_comp_verified ? "Yes" : "No",
      bid.license_verified ? "Yes" : "No",
      bid.warranty_years || "N/A",
      bid.portfolio_projects_count || 0,
      bid.references_count || 0,
    ]);

    const csvContent = [
      `Bid Comparison Report - ${opportunityTitle}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bid-comparison-${opportunityTitle.replace(/\s+/g, "-")}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Bid Comparison Report", 14, 20);

    doc.setFontSize(12);
    doc.text(opportunityTitle, 14, 30);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

    // Top 3 Summary
    doc.setFontSize(14);
    doc.text("Top 3 Recommendations", 14, 50);

    const top3Data = topThree.map((bid, index) => {
      const rank = getRankBadge(index);
      return [
        rank.label,
        bid.profiles?.full_name || "Professional",
        `Score: ${bid.score}`,
        formatCurrency(bid.bid_amount),
        `${bid.overall_rating?.toFixed(1) || "N/A"} ★`,
        `${bid.years_in_business || 0} yrs exp`,
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [["Rank", "Professional", "Score", "Bid Amount", "Rating", "Experience"]],
      body: top3Data,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Detailed Comparison
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Detailed Comparison", 14, 20);

    const detailedData = rankedBids.map((bid, index) => [
      `#${index + 1}`,
      bid.profiles?.full_name || "Professional",
      bid.score.toString(),
      formatCurrency(bid.bid_amount),
      bid.overall_rating?.toFixed(1) || "N/A",
      bid.years_in_business?.toString() || "0",
      bid.crew_size?.toString() || "0",
      bid.has_project_manager ? "✓" : "✗",
      bid.insurance_verified ? "✓" : "✗",
      bid.warranty_years?.toString() || "N/A",
    ]);

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Rank",
          "Professional",
          "Score",
          "Bid",
          "Rating",
          "Exp",
          "Crew",
          "PM",
          "Ins",
          "Warr",
        ],
      ],
      body: detailedData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    doc.save(
      `bid-comparison-${opportunityTitle.replace(/\s+/g, "-")}-${Date.now()}.pdf`
    );

    toast.success("PDF exported successfully!");
  };

  // Send to Homeowner Portal
  const sendToHomeowner = async () => {
    if (!projectId) {
      toast.error("No project linked to this opportunity");
      return;
    }

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get homeowner info
      const { data: homeownerProjects } = await supabase
        .from('homeowner_projects')
        .select('homeowner_id')
        .eq('project_id', projectId);

      if (!homeownerProjects || homeownerProjects.length === 0) {
        toast.error("No homeowner found for this project");
        return;
      }

      const homeownerId = homeownerProjects[0].homeowner_id;

      const { data: homeownerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', homeownerId)
        .single();

      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;
      
      const homeownerAuth = usersData?.users?.find((u: any) => u.id === homeownerId);
      const homeownerEmail = homeownerAuth?.email;

      if (!homeownerEmail) {
        toast.error("Homeowner email not found");
        return;
      }

      const { data: estimatorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: opportunity } = await supabase
        .from('bid_opportunities')
        .select('title')
        .eq('id', opportunityId)
        .single();

      // Prepare report data
      const reportData = {
        opportunityTitle,
        generatedAt: new Date().toISOString(),
        topThree: topThree.map((bid) => ({
          id: bid.id,
          professional: bid.profiles?.full_name || "Professional",
          bidderType: bid.bidder_type,
          score: bid.score,
          bidAmount: bid.bid_amount,
          rating: bid.overall_rating,
          yearsInBusiness: bid.years_in_business,
          crewSize: bid.crew_size,
          hasProjectManager: bid.has_project_manager,
          anticipatedStartDate: bid.anticipated_start_date,
          projectDurationWeeks: bid.project_duration_weeks,
          insuranceVerified: bid.insurance_verified,
          workersCompVerified: bid.workers_comp_verified,
          licenseVerified: bid.license_verified,
          warrantyYears: bid.warranty_years,
          warrantyTerms: bid.warranty_terms,
          portfolioProjectsCount: bid.portfolio_projects_count,
          referencesCount: bid.references_count,
          estimatorNotes: bid.estimator_notes,
          estimatorRecommendation: bid.estimator_recommendation,
        })),
        allBids: rankedBids.map((bid) => ({
          id: bid.id,
          professional: bid.profiles?.full_name || "Professional",
          score: bid.score,
          bidAmount: bid.bid_amount,
        })),
      };

      const { data: report, error: reportError } = await supabase
        .from("bid_comparison_reports")
        .insert({
          bid_opportunity_id: opportunityId,
          project_id: projectId,
          created_by: user.id,
          report_data: reportData,
          status: "pending",
          preferred_bid_id: preferredBidId,
          estimator_recommendation: overallRecommendation,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Send notification
      await supabase.functions.invoke('send-bid-comparison', {
        body: {
          homeownerId: homeownerId,
          homeownerEmail: homeownerEmail,
          homeownerName: homeownerProfile?.full_name || 'Homeowner',
          estimatorName: estimatorProfile?.full_name || 'Estimator',
          projectName: opportunity?.title || 'Your Project',
          reportId: report.id,
          recommendation: overallRecommendation
        }
      });

      toast.success("Bid comparison sent to homeowner portal!");
    } catch (error) {
      console.error("Error sending to homeowner:", error);
      toast.error("Failed to send comparison to homeowner");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenNotes = (bid: BidSubmission) => {
    setSelectedBidForNotes(bid);
    setEstimatorNotes(bid.estimator_notes || "");
    setEstimatorRecommendation(bid.estimator_recommendation || "");
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedBidForNotes) return;

    try {
      const { error } = await supabase
        .from("bid_submissions")
        .update({
          estimator_notes: estimatorNotes,
          estimator_recommendation: estimatorRecommendation,
        })
        .eq("id", selectedBidForNotes.id);

      if (error) throw error;

      toast.success("Notes saved successfully!");
      setNotesDialogOpen(false);
      
      // Update local state
      const updatedBid = { ...selectedBidForNotes, estimator_notes: estimatorNotes, estimator_recommendation: estimatorRecommendation };
      setSelectedBidForNotes(updatedBid);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bid Comparison Matrix</h2>
          <p className="text-muted-foreground">{opportunityTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {rankedBids.length} Submissions
          </Badge>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {projectId && (
            <Button 
              size="sm" 
              onClick={sendToHomeowner}
              disabled={isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send to Homeowner"}
            </Button>
          )}
        </div>
      </div>

      {/* Estimator Recommendation Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="preferred-bid">Mark Preferred Vendor</Label>
            <select
              id="preferred-bid"
              value={preferredBidId || ""}
              onChange={(e) => setPreferredBidId(e.target.value || null)}
              className="w-full mt-2 p-2 border rounded-md bg-background"
            >
              <option value="">No preference (homeowner decides)</option>
              {rankedBids.map((bid) => (
                <option key={bid.id} value={bid.id}>
                  {bid.profiles?.full_name || "Professional"} - {formatCurrency(bid.bid_amount)} (Score: {bid.score})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="overall-rec">Overall Recommendation to Homeowner</Label>
            <Textarea
              id="overall-rec"
              placeholder="Add your overall recommendation and context for the homeowner (e.g., 'I recommend Elite Home Renovations for their excellent track record and competitive pricing...')"
              value={overallRecommendation}
              onChange={(e) => setOverallRecommendation(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {topThree.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No bids to compare yet.</p>
        </Card>
      ) : (
        <>
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((bid, index) => {
              const rank = getRankBadge(index);
              return (
                <Card key={bid.id} className="p-6 border-2 relative">
                  {preferredBidId === bid.id && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={rank.variant} className="text-sm">
                        {rank.label}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg">{bid.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {bid.profiles?.full_name || "Professional"}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {bid.bidder_type.replace("_", " ")}
                      </p>
                    </div>
                    {bid.estimator_recommendation && (
                      <div className="bg-primary/10 p-2 rounded-md">
                        <p className="text-xs font-medium text-primary">
                          {bid.estimator_recommendation}
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bid Amount:</span>
                        <span className="font-semibold">
                          {formatCurrency(bid.bid_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {bid.overall_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Experience:</span>
                        <span className="font-semibold">
                          {bid.years_in_business || 0} years
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNotes(bid)}
                        className="w-full gap-2"
                      >
                        <MessageSquare className="h-3 w-3" />
                        {bid.estimator_notes || bid.estimator_recommendation
                          ? "Edit Notes"
                          : "Add Notes"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Professional</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("score")}
                        className="flex items-center gap-1"
                      >
                        Score
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("bid_amount")}
                        className="flex items-center gap-1"
                      >
                        Bid Amount
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("overall_rating")}
                        className="flex items-center gap-1"
                      >
                        Rating
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("years_in_business")}
                        className="flex items-center gap-1"
                      >
                        Experience
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("crew_size")}
                        className="flex items-center gap-1"
                      >
                        Crew Size
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>PM</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("anticipated_start_date")}
                        className="flex items-center gap-1"
                      >
                        Start Date
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Verifications</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Portfolio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedBids.map((bid, index) => (
                    <TableRow
                      key={bid.id}
                      className={index < 3 ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {bid.profiles?.full_name || "Professional"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {bid.bidder_type.replace("_", " ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg">{bid.score}</span>
                          {index < 3 && (
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          isHighlighted(bid, "bid_amount", true)
                            ? "bg-green-100 dark:bg-green-900/20 font-semibold"
                            : ""
                        }
                      >
                        {formatCurrency(bid.bid_amount)}
                      </TableCell>
                      <TableCell
                        className={
                          isHighlighted(bid, "overall_rating")
                            ? "bg-green-100 dark:bg-green-900/20"
                            : ""
                        }
                      >
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {bid.overall_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          isHighlighted(bid, "years_in_business")
                            ? "bg-green-100 dark:bg-green-900/20"
                            : ""
                        }
                      >
                        {bid.years_in_business || 0} yrs
                      </TableCell>
                      <TableCell
                        className={
                          isHighlighted(bid, "crew_size")
                            ? "bg-green-100 dark:bg-green-900/20"
                            : ""
                        }
                      >
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {bid.crew_size || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bid.has_project_manager ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {bid.anticipated_start_date
                              ? new Date(bid.anticipated_start_date).toLocaleDateString()
                              : "TBD"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {bid.project_duration_weeks
                          ? `${bid.project_duration_weeks} wks`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {bid.insurance_verified && (
                            <div title="Insurance Verified">
                              <Shield className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {bid.workers_comp_verified && (
                            <div title="Workers Comp Verified">
                              <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {bid.license_verified && (
                            <div title="License Verified">
                              <CheckCircle2 className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bid.warranty_years
                          ? `${bid.warranty_years} yr${bid.warranty_years > 1 ? "s" : ""}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{bid.portfolio_projects_count || 0} projects</div>
                          <div className="text-xs text-muted-foreground">
                            {bid.references_count || 0} refs
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 border" />
                <span>Best Value</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Insurance Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Workers Comp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <span>License Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>Overall Score (0-100)</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Estimator Notes - {selectedBidForNotes?.profiles?.full_name || "Professional"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="recommendation">
                Recommendation Badge (Visible to Homeowner)
              </Label>
              <Input
                id="recommendation"
                placeholder='e.g., "Best Value", "Premium Quality", "Fastest Timeline"'
                value={estimatorRecommendation}
                onChange={(e) => setEstimatorRecommendation(e.target.value)}
                className="mt-2"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Short phrase that will appear as a badge on the homeowner view
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Internal Notes (Private - Not Visible to Homeowner)</Label>
              <Textarea
                id="notes"
                placeholder="Add internal notes about this contractor, pricing details, concerns, or other context..."
                value={estimatorNotes}
                onChange={(e) => setEstimatorNotes(e.target.value)}
                rows={5}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
