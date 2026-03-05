import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Upload } from "lucide-react";

interface BidOpportunity {
  id: string;
  title: string;
  description: string;
  estimated_budget: number;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface SubmitBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: BidOpportunity;
  onBidSubmitted: () => void;
}

export function SubmitBidDialog({
  open,
  onOpenChange,
  opportunity,
  onBidSubmitted,
}: SubmitBidDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [proposalText, setProposalText] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const addLineItem = () => {
    const newId = String(lineItems.length + 1);
    setLineItems([
      ...lineItems,
      { id: newId, description: "", quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updated.total = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const getTotalBidAmount = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (!proposalText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a proposal description",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = getTotalBidAmount();
    if (totalAmount <= 0) {
      toast({
        title: "Invalid Bid Amount",
        description: "Please add line items with valid amounts",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload attachments if any
      const uploadedAttachments = [];
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bid-message-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        uploadedAttachments.push({
          name: file.name,
          path: fileName,
          size: file.size,
          type: file.type,
        });
      }

      // Submit the bid
      const { error } = await supabase.from("bid_submissions").insert({
        bid_opportunity_id: opportunity.id,
        bidder_id: user.id,
        bidder_type: "contractor",
        bid_amount: totalAmount,
        proposal_text: proposalText,
        estimated_timeline: estimatedTimeline,
        attachments: uploadedAttachments,
        status: "submitted",
      });

      if (error) throw error;

      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully",
      });

      onBidSubmitted();
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: "Failed to submit bid",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Bid - {opportunity.title}</DialogTitle>
          <DialogDescription>
            Create your bid with line items and attachments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {index === 0 && <Label className="text-sm mb-1">Description</Label>}
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-sm mb-1">Quantity</Label>}
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-sm mb-1">Unit Price</Label>}
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-sm mb-1">Total</Label>}
                    <Input
                      value={`$${item.total.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <div className="text-lg font-semibold">
                Total Bid Amount: ${getTotalBidAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Proposal Text */}
          <div className="space-y-2">
            <Label htmlFor="proposal">Proposal Description</Label>
            <Textarea
              id="proposal"
              placeholder="Describe your approach, qualifications, and any relevant details..."
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              rows={6}
            />
          </div>

          {/* Estimated Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">Estimated Timeline</Label>
            <Input
              id="timeline"
              placeholder="e.g., 6-8 weeks"
              value={estimatedTimeline}
              onChange={(e) => setEstimatedTimeline(e.target.value)}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {attachments.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {attachments.length} file(s) selected
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
