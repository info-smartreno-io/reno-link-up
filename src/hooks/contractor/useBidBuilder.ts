import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BidLineItem {
  id?: string;
  cost_code_id: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  is_alternate: boolean;
  sort_order: number;
}

export function useBidBuilder(opportunityId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lineItems, setLineItems] = useState<BidLineItem[]>([]);
  const [exclusions, setExclusions] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");

  // Fetch contractor's cost codes
  const { data: costCodes } = useQuery({
    queryKey: ["contractor-cost-codes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("cost_codes")
        .select("*")
        .eq("contractor_id", user.id)
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch existing draft submission for this opportunity
  const { data: existingSubmission } = useQuery({
    queryKey: ["bid-draft", opportunityId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("bid_submissions")
        .select("*")
        .eq("bid_opportunity_id", opportunityId)
        .eq("bidder_id", user.id)
        .eq("bidder_type", "contractor")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing line items if draft exists
  const { data: existingLineItems } = useQuery({
    queryKey: ["bid-line-items", existingSubmission?.id],
    enabled: !!existingSubmission?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_line_items")
        .select("*")
        .eq("bid_submission_id", existingSubmission!.id)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Load existing data
  useEffect(() => {
    if (existingSubmission) {
      setProposalText(existingSubmission.proposal_text || "");
      setEstimatedTimeline(existingSubmission.estimated_timeline || "");
    }
    if (existingLineItems && existingLineItems.length > 0) {
      setLineItems(existingLineItems.map((li) => ({
        id: li.id,
        cost_code_id: li.cost_code_id,
        description: li.description,
        unit: li.unit,
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        is_alternate: li.is_alternate || false,
        sort_order: li.sort_order || 0,
      })));
    }
  }, [existingSubmission, existingLineItems]);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      {
        cost_code_id: null,
        description: "",
        unit: "EA",
        quantity: 1,
        unit_price: 0,
        is_alternate: false,
        sort_order: prev.length,
      },
    ]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLineItem = useCallback((index: number, field: keyof BidLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const populateFromCostCodes = useCallback(() => {
    if (!costCodes || costCodes.length === 0) return;
    const items: BidLineItem[] = costCodes.map((cc, i) => ({
      cost_code_id: cc.id,
      description: cc.description,
      unit: cc.unit,
      quantity: 1,
      unit_price: Number(cc.total_unit_price || 0),
      is_alternate: false,
      sort_order: i,
    }));
    setLineItems(items);
  }, [costCodes]);

  const totalAmount = lineItems
    .filter((li) => !li.is_alternate)
    .reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  const alternatesTotal = lineItems
    .filter((li) => li.is_alternate)
    .reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "submitted") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert bid submission
      const submissionData = {
        bid_opportunity_id: opportunityId,
        bidder_id: user.id,
        bidder_type: "contractor" as const,
        bid_amount: totalAmount,
        proposal_text: proposalText || null,
        estimated_timeline: estimatedTimeline || null,
        status,
        attachments: exclusions ? [{ type: "exclusions", text: exclusions }] : null,
      };

      let submissionId = existingSubmission?.id;

      if (submissionId) {
        const { error } = await supabase
          .from("bid_submissions")
          .update(submissionData)
          .eq("id", submissionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("bid_submissions")
          .insert(submissionData)
          .select("id")
          .single();
        if (error) throw error;
        submissionId = data.id;
      }

      // Delete existing line items and re-insert
      await supabase
        .from("bid_line_items")
        .delete()
        .eq("bid_submission_id", submissionId!);

      if (lineItems.length > 0) {
        const { error: lineError } = await supabase
          .from("bid_line_items")
          .insert(
            lineItems.map((li, i) => ({
              bid_submission_id: submissionId!,
              cost_code_id: li.cost_code_id,
              description: li.description,
              unit: li.unit,
              quantity: li.quantity,
              unit_price: li.unit_price,
              is_alternate: li.is_alternate,
              sort_order: i,
            }))
          );
        if (lineError) throw lineError;
      }

      return { submissionId, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bid-draft", opportunityId] });
      queryClient.invalidateQueries({ queryKey: ["contractor-bids"] });
      toast({
        title: result.status === "submitted" ? "Bid Submitted" : "Draft Saved",
        description:
          result.status === "submitted"
            ? "Your bid has been submitted successfully."
            : "Your bid draft has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save bid: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    lineItems,
    exclusions,
    setExclusions,
    proposalText,
    setProposalText,
    estimatedTimeline,
    setEstimatedTimeline,
    costCodes: costCodes || [],
    addLineItem,
    removeLineItem,
    updateLineItem,
    populateFromCostCodes,
    totalAmount,
    alternatesTotal,
    saveDraft: () => saveMutation.mutate("draft"),
    submitBid: () => saveMutation.mutate("submitted"),
    isSaving: saveMutation.isPending,
    existingSubmission,
  };
}
