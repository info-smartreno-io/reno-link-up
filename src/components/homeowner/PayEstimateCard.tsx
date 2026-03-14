import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { useState } from "react";
import { toast } from "sonner";

const ESTIMATE_FEE_CENTS = 14999; // $149.99

export function PayEstimateCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: intakeProject, isLoading } = useQuery({
    queryKey: ["homeowner-intake-pay-estimate"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, user_id, status, workflow_status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[PayEstimateCard] projects error", error);
        return null;
      }
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const workflowStatus = (intakeProject as { workflow_status?: string } | null)?.workflow_status;
  const needsPayment =
    intakeProject &&
    intakeProject.id &&
    intakeProject.user_id &&
    workflowStatus === "estimate_ready";

  const handlePayEstimate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !intakeProject?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-estimate-checkout", {
        body: {
          projectId: intakeProject.id,
          homeownerId: user.id,
          estimateFee: ESTIMATE_FEE_CENTS,
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (url) {
        trackEvent("estimate_payment_started", { project_id: intakeProject.id, category: "Homeowner" });
        window.location.href = url;
        return;
      }
      toast.error("Could not start checkout. Please try again.");
    } catch (e) {
      console.error("[PayEstimateCard] create-estimate-checkout error", e);
      toast.error(
        (e as Error)?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !needsPayment) return null;

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              Pay for your estimate
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your SmartEstimate is ready. Pay the one-time estimate fee to unlock your detailed estimate and contractor bids.
            </p>
          </div>
        </div>
        <Button
          className="gap-2 flex-shrink-0"
          onClick={handlePayEstimate}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Pay $149.99"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
