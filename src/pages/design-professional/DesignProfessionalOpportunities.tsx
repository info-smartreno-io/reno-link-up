import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, Calendar, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DesignProfessionalOpportunities() {
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["dp-opportunities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get bid opportunities open to designers/architects
      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("*")
        .or("open_to_architects.eq.true,open_to_interior_designers.eq.true")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const expressInterest = useMutation({
    mutationFn: async (oppId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("design_professional_matches")
        .insert({
          project_id: oppId,
          design_professional_user_id: user.id,
          status: "interested",
          match_score: 0,
          responded_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Interest expressed! The team will follow up.");
      queryClient.invalidateQueries({ queryKey: ["dp-opportunities"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <p className="text-muted-foreground">Projects looking for design professionals</p>
      </div>

      {opportunities?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No opportunities right now</h3>
            <p className="text-muted-foreground">Complete your profile to improve matching. New projects are posted regularly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities?.map((opp) => (
            <Card key={opp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">{opp.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.location}</span>
                      {opp.estimated_budget && (
                        <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${opp.estimated_budget.toLocaleString()}</span>
                      )}
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Due {format(new Date(opp.bid_deadline), "MMM d, yyyy")}</span>
                    </div>
                    {opp.description && <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>}
                    <div className="flex gap-2">
                      <Badge variant="outline">{opp.project_type}</Badge>
                      {opp.open_to_architects && <Badge variant="secondary">Architects</Badge>}
                      {opp.open_to_interior_designers && <Badge variant="secondary">Designers</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => expressInterest.mutate(opp.id)} disabled={expressInterest.isPending}>
                      <ThumbsUp className="mr-1 h-4 w-4" /> Interested
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
