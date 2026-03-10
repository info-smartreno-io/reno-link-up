import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Home,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { generateDemoKitchenRemodel } from "@/utils/demoData";
import { useNavigate } from "react-router-dom";

export default function HomeownerBidDemo() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  const demoData = generateDemoKitchenRemodel();
  const { opportunityTitle, bids } = demoData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveSelection = () => {
    if (!selectedBid) {
      toast.error("Please select a contractor first");
      return;
    }

    const selected = bids.find((b) => b.id === selectedBid);
    toast.success(`Selection saved! You chose: ${selected?.profiles?.full_name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-primary">SmartReno</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Demo
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Homeowner Portal - Bid Review</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{opportunityTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">Demo Example</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your estimator has prepared a comparison of the top {bids.length} contractors for
                your kitchen remodel. Review the options below and select your preferred contractor.
              </p>
            </CardContent>
          </Card>

          {/* Top 3 Bids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bids.map((bid, index) => {
              const isSelected = selectedBid === bid.id;
              const ranks = ["🥇 Top Pick", "🥈 Runner Up", "🥉 Third Place"];

              return (
                <Card
                  key={bid.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary border-2 shadow-lg"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedBid(bid.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {ranks[index]}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg">
                          {(
                            (bid.overall_rating || 0) * 5 +
                            Math.min((bid.years_in_business || 0) / 20 * 20, 20) +
                            Math.min((bid.crew_size || 0) / 10 * 15, 15) +
                            (bid.has_project_manager ? 10 : 0) +
                            (bid.insurance_verified ? 5 : 0) +
                            (bid.workers_comp_verified ? 5 : 0) +
                            (bid.license_verified ? 5 : 0) +
                            Math.min((bid.warranty_years || 0) * 2, 10)
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{bid.profiles?.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      Professional Contractor
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Bid Amount</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(bid.bid_amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {bid.overall_rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Experience</span>
                      <span className="font-semibold">{bid.years_in_business} years</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Crew Size</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{bid.crew_size}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Project Manager</span>
                      {bid.has_project_manager ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-sm">No</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Can Start</span>
                      <span className="text-sm">
                        {bid.anticipated_start_date
                          ? new Date(bid.anticipated_start_date).toLocaleDateString()
                          : "TBD"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="text-sm">{bid.project_duration_weeks} weeks</span>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Verifications</p>
                      <div className="flex gap-2 flex-wrap">
                        {bid.insurance_verified && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Insured
                          </Badge>
                        )}
                        {bid.workers_comp_verified && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Workers Comp
                          </Badge>
                        )}
                        {bid.license_verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Licensed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {bid.warranty_years && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Warranty</p>
                        <p className="font-semibold">{bid.warranty_years} years</p>
                        {bid.warranty_terms && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {bid.warranty_terms}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Portfolio:</span>
                        <span className="font-medium">{bid.portfolio_projects_count} projects</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">References:</span>
                        <span className="font-medium">{bid.references_count}</span>
                      </div>
                    </div>

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
                  Notes or Questions for Your Construction Agent (Optional)
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
                  Save My Selection (Demo)
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

              <p className="text-sm text-center text-muted-foreground">
                This is a demonstration. In the real portal, your selection will be sent to your estimator.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
