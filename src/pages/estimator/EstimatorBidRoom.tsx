import { useState, useEffect } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, FileText, Clock } from "lucide-react";
import { SubmitBidDialog } from "@/components/estimator/SubmitBidDialog";
import { format } from "date-fns";

interface BidOpportunity {
  id: string;
  title: string;
  description: string;
  project_type: string;
  location: string;
  estimated_budget: number;
  bid_deadline: string;
  status: string;
  square_footage: number | null;
  attachments: any;
  created_at: string;
  open_to_contractors: boolean;
}

export default function EstimatorBidRoom() {
  const [opportunities, setOpportunities] = useState<BidOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<BidOpportunity | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("*")
        .eq("status", "open")
        .eq("open_to_contractors", true)
        .order("bid_deadline", { ascending: true });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "Failed to load bid opportunities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = (opportunity: BidOpportunity) => {
    setSelectedOpportunity(opportunity);
    setSubmitDialogOpen(true);
  };

  const handleBidSubmitted = () => {
    setSubmitDialogOpen(false);
    setSelectedOpportunity(null);
    toast({
      title: "Bid Submitted",
      description: "Your bid has been submitted successfully",
    });
  };

  const getStatusBadgeVariant = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return "destructive";
    if (daysUntil <= 3) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <EstimatorLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading opportunities...</p>
        </div>
      </EstimatorLayout>
    );
  }

  return (
    <EstimatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bid Room</h1>
          <p className="text-muted-foreground">
            View and submit bids for available opportunities
          </p>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No open opportunities available at this time
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(opportunity.bid_deadline)}>
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(opportunity.bid_deadline), "MMM d")}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {opportunity.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      {opportunity.location}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      {opportunity.project_type}
                    </div>
                    {opportunity.estimated_budget && (
                      <div className="flex items-center text-muted-foreground">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Est. Budget: ${opportunity.estimated_budget.toLocaleString()}
                      </div>
                    )}
                    {opportunity.square_footage && (
                      <div className="flex items-center text-muted-foreground">
                        <FileText className="mr-2 h-4 w-4" />
                        {opportunity.square_footage.toLocaleString()} sq ft
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Deadline: {format(new Date(opportunity.bid_deadline), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>

                  {opportunity.attachments && Array.isArray(opportunity.attachments) && opportunity.attachments.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {opportunity.attachments.length} attachment(s)
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleSubmitBid(opportunity)}
                  >
                    Submit Bid
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedOpportunity && (
          <SubmitBidDialog
            open={submitDialogOpen}
            onOpenChange={setSubmitDialogOpen}
            opportunity={selectedOpportunity}
            onBidSubmitted={handleBidSubmitted}
          />
        )}
      </div>
    </EstimatorLayout>
  );
}
