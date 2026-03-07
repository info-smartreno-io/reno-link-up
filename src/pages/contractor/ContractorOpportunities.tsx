import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useOpportunities } from "@/hooks/contractor/useOpportunities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, DollarSign, MapPin, Building2, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ContractorOpportunities() {
  const { data: opportunities, isLoading } = useOpportunities();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const isDeadlineSoon = (deadline: string) => {
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 3;
  };

  const daysUntilDeadline = (deadline: string) => {
    return Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  const projectTypes = [...new Set(opportunities?.map((o) => o.project_type) || [])];

  const filtered = (opportunities || []).filter((opp) => {
    const matchesSearch =
      !search ||
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || opp.project_type === typeFilter;
    return matchesSearch && matchesType;
  });

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
        <div>
          <h1 className="text-3xl font-bold">Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Browse matched projects and submit bids
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:max-w-[200px]">
              <SelectValue placeholder="Project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No open opportunities at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((opp) => {
              const days = daysUntilDeadline(opp.bid_deadline);
              const urgent = days <= 3;

              return (
                <Card key={opp.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{opp.title}</CardTitle>
                        <CardDescription>{opp.project_type}</CardDescription>
                      </div>
                      {urgent && (
                        <Badge variant="destructive" className="shrink-0">
                          {days <= 0 ? "Expired" : `${days}d left`}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    {opp.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {opp.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 shrink-0" />
                        {opp.location}
                      </div>
                      {opp.estimated_budget && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-2 shrink-0" />
                          ${opp.estimated_budget.toLocaleString()} budget
                        </div>
                      )}
                      {opp.square_footage && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4 mr-2 shrink-0" />
                          {opp.square_footage.toLocaleString()} sq ft
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                        <span className={urgent ? "text-destructive font-medium" : "text-muted-foreground"}>
                          Bid by {new Date(opp.bid_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => navigate(`/contractor/rfp/${opp.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Packet
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ContractorLayout>
  );
}
