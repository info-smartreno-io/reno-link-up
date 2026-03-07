import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHomeownerProposals, useSelectContractor } from "@/hooks/useHomeownerData";
import { Building2, Clock, Calendar, CheckCircle2, DollarSign } from "lucide-react";
import { useState } from "react";

export default function HomeownerProposals() {
  const { projectId } = useParams();
  const { data: proposals, isLoading } = useHomeownerProposals(projectId);
  const selectMutation = useSelectContractor(projectId);
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!proposals?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No proposals available yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Proposals will appear here once contractors submit their bids.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSelect = () => {
    if (confirmBidId) {
      selectMutation.mutate(confirmBidId);
      setConfirmBidId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Contractor Proposals</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review and compare proposals, then select your preferred contractor.
        </p>
      </div>

      <div className="grid gap-4">
        {proposals.map((bid: any) => (
          <Card key={bid.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-foreground">{bid.companyName || "Contractor"}</h4>
                  </div>
                  {bid.contractorName && (
                    <p className="text-xs text-muted-foreground">{bid.contractorName}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">
                        ${bid.bid_amount?.toLocaleString()}
                      </span>
                    </div>
                    {bid.project_duration_weeks && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{bid.project_duration_weeks} weeks</span>
                      </div>
                    )}
                    {bid.anticipated_start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Start: {new Date(bid.anticipated_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {bid.proposal_text && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{bid.proposal_text}</p>
                  )}
                  {bid.warranty_years && (
                    <p className="text-xs text-muted-foreground">{bid.warranty_years}-year warranty included</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {bid.status === "accepted" ? (
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Selected
                    </Badge>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setConfirmBidId(bid.id)}>
                          Select Contractor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Contractor Selection</DialogTitle>
                          <DialogDescription>
                            You're selecting <strong>{bid.companyName}</strong> for ${bid.bid_amount?.toLocaleString()}. 
                            This will notify the contractor and your SmartReno coordinator.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setConfirmBidId(null)}>Cancel</Button>
                          <Button onClick={handleSelect} disabled={selectMutation.isPending}>
                            {selectMutation.isPending ? "Confirming..." : "Confirm Selection"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
