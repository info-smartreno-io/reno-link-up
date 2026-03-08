import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartEstimateList, useSmartEstimateMutations } from "@/hooks/useSmartEstimate";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Eye, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
};

export default function EstimatorSmartEstimates() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const mutations = useSmartEstimateMutations();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: estimates = [], isLoading } = useSmartEstimateList(
    userId ? { estimatorId: userId } : undefined
  );

  return (
    <EstimatorLayout>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Smart Estimates</h1>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Assigned Estimates</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : estimates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No estimates assigned to you yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project / Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((est: any) => (
                  <TableRow key={est.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/estimator/smart-estimates/${est.id}`)}>
                    <TableCell className="font-medium">
                      {est.leads?.name || "—"}
                      <span className="block text-xs text-muted-foreground">{est.leads?.project_type || ""}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[est.status] || ""}>{est.status?.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={est.estimate_completion_percent || 0} className="w-20 h-2" />
                        <span className="text-xs">{est.estimate_completion_percent || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{est.estimate_confidence_score || 0}/100</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {est.updated_at ? format(new Date(est.updated_at), "MMM d") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
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
