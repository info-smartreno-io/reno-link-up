import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";

interface BidOpportunity {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  location: string;
  estimated_budget: number | null;
}

interface InteriorDesignerBidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: BidOpportunity | null;
  designerId: string;
}

export default function InteriorDesignerBidSubmissionDialog({
  open,
  onOpenChange,
  opportunity,
  designerId,
}: InteriorDesignerBidSubmissionDialogProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!opportunity || !bidAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter a bid amount.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const attachmentUrls: string[] = [];
      
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${opportunity.id}/${designerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('architect-proposals')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data, error: urlError } = await supabase.storage
            .from('architect-proposals')
            .createSignedUrl(fileName, 3600);
          
          if (urlError || !data?.signedUrl) {
            throw urlError || new Error('Failed to create signed URL');
          }
          
          attachmentUrls.push(data.signedUrl);
        }
      }

      const { error: insertError } = await supabase
        .from('bid_submissions')
        .insert({
          bid_opportunity_id: opportunity.id,
          bidder_id: designerId,
          bidder_type: 'interior_designer',
          bid_amount: parseFloat(bidAmount),
          estimated_timeline: estimatedTimeline || null,
          proposal_text: proposalText || null,
          attachments: attachmentUrls,
          status: 'submitted',
        });

      if (insertError) throw insertError;

      toast({
        title: "Proposal Submitted",
        description: "Your bid has been submitted successfully.",
      });

      setBidAmount("");
      setEstimatedTimeline("");
      setProposalText("");
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Proposal</DialogTitle>
          <DialogDescription>
            {opportunity?.title} - {opportunity?.project_type}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Bid Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTimeline">Estimated Timeline</Label>
            <Input
              id="estimatedTimeline"
              type="text"
              placeholder="e.g., 8-12 weeks"
              value={estimatedTimeline}
              onChange={(e) => setEstimatedTimeline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposalText">Proposal Details</Label>
            <Textarea
              id="proposalText"
              placeholder="Describe your approach, qualifications, and any relevant details..."
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <div className="space-y-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted p-2 rounded-md text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
