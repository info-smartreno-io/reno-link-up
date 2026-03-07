import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useOpportunities } from "@/hooks/contractor/useOpportunities";
import { useSmartMatchScores, useCalculateSmartMatch, getMatchLabel } from "@/hooks/contractor/useSmartMatch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Calendar, DollarSign, MapPin, Building2, FileText, Eye, Sparkles, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

export default function ContractorOpportunities() {
  const { data: opportunities, isLoading } = useOpportunities();
  const { data: matchScores = [], isLoading: scoresLoading } = useSmartMatchScores();
  const calculateMatch = useCalculateSmartMatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Auto-calculate matches when opportunities load
  useEffect(() => {
    if (opportunities && opportunities.length > 0 && matchScores.length === 0 && !scoresLoading) {
      calculateMatch.mutate(undefined);
    }
  }, [opportunities?.length]);

  const scoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    matchScores.forEach((s) => { map[s.bid_opportunity_id] = s.match_score; });
    return map;
  }, [matchScores]);

  const projectTypes = [...new Set(opportunities?.map((o) => o.project_type) || [])];

  const filtered = useMemo(() => {
    return (opportunities || [])
      .filter((opp) => {
        const matchesSearch = !search ||
          opp.title.toLowerCase().includes(search.toLowerCase()) ||
          opp.location.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || opp.project_type === typeFilter;
        const score = scoreMap[opp.id] ?? 50;
        const matchesScore = score >= minMatchScore;
        return matchesSearch && matchesType && matchesScore;
      })
      .sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0));
  }, [opportunities, search, typeFilter, minMatchScore, scoreMap]);

  const daysUntilDeadline = (deadline: string) =>
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
            <h1 className="text-3xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground mt-1">Sorted by Smart Match score</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => calculateMatch.mutate(undefined)}
            disabled={calculateMatch.isPending}
          >
            {calculateMatch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Scores
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
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
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3 sm:max-w-[240px] w-full">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Min Match:</span>
            <Slider value={[minMatchScore]} onValueChange={([v]) => setMinMatchScore(v)} max={100} step={10} className="flex-1" />
            <span className="text-sm font-medium text-foreground w-10 text-right">{minMatchScore}%</span>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No matching opportunities found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((opp) => {
              const days = daysUntilDeadline(opp.bid_deadline);
              const urgent = days <= 3;
              const score = scoreMap[opp.id] ?? 0;
              const { label: matchLabel, color: matchColor } = getMatchLabel(score);

              return (
                <Card key={opp.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{opp.title}</CardTitle>
                        <CardDescription>{opp.project_type}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {score > 0 && (
                          <div className="flex items-center gap-1">
                            <Sparkles className={`h-4 w-4 ${matchColor}`} />
                            <span className={`text-sm font-bold ${matchColor}`}>{score}%</span>
                          </div>
                        )}
                        {urgent && (
                          <Badge variant="destructive" className="text-xs">
                            {days <= 0 ? "Expired" : `${days}d left`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {score > 0 && (
                      <Badge variant="outline" className={`w-fit text-xs ${matchColor}`}>
                        {matchLabel}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    {opp.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>
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
                    <Button className="w-full" onClick={() => navigate(`/contractor/rfp/${opp.id}`)}>
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
