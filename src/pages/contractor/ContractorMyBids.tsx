import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useContractorBids } from "@/hooks/contractor/useContractorBids";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Calendar, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Bids" },
  { value: "draft", label: "Drafts" },
  { value: "submitted", label: "Submitted" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "awarded", label: "Awarded" },
  { value: "not_selected", label: "Not Selected" },
];

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  shortlisted: "default",
  awarded: "default",
  not_selected: "outline",
  withdrawn: "destructive",
};

export default function ContractorMyBids() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: bids, isLoading } = useContractorBids(statusFilter);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Bids</h1>
            <p className="text-muted-foreground mt-1">Track all your bid submissions</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!bids || bids.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bids found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/contractor/opportunities")}>
                Browse Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {bid.bid_opportunities?.title || "Untitled Opportunity"}
                      </CardTitle>
                      <CardDescription>
                        {bid.bid_opportunities?.project_type} • {bid.bid_opportunities?.location}
                      </CardDescription>
                    </div>
                    <Badge variant={statusBadgeVariant[bid.status] || "secondary"}>
                      {bid.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-semibold">${bid.bid_amount.toLocaleString()}</span>
                      </div>
                      {bid.estimated_timeline && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {bid.estimated_timeline}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Submitted {new Date(bid.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/contractor/rfp/${bid.bid_opportunity_id}`)}
                    >
                      View <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ContractorLayout>
  );
}
