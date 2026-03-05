import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BidOpportunity {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  location: string;
  estimated_budget: number | null;
}

interface ContractorBidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: BidOpportunity | null;
  contractorId: string;
}

export default function ContractorBidSubmissionDialog({
  open,
  onOpenChange,
  opportunity,
  contractorId,
}: ContractorBidSubmissionDialogProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  // AI Bid Preparation State
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [showAIDraft, setShowAIDraft] = useState(false);
  const [contractorNotes, setContractorNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleGenerateAIDraft = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-bid-preparation', {
        body: {
          projectId: opportunity?.id,
          scope: { description: opportunity?.description, type: opportunity?.project_type },
          estimateDraft: null,
          photos: [],
          contractorNotes
        }
      });

      if (error) throw error;

      setAiDraft(data);
      setShowAIDraft(true);
      
      toast({
        title: "AI Draft Generated",
        description: `Generated ${data.draft_items?.length || 0} bid items. Review and apply.`,
      });
    } catch (error: any) {
      console.error('Error generating AI draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI draft",
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleApplyAIDraft = () => {
    if (!aiDraft?.draft_items) return;
    
    const draftText = aiDraft.draft_items.map((item: any) => 
      `${item.description} - ${item.suggestedQty} ${item.suggestedUnit} ${item.notes ? `(${item.notes})` : ''}`
    ).join('\n');
    
    setProposalText(prev => prev + '\n\n' + draftText);
    
    toast({
      title: "Applied",
      description: `Added ${aiDraft.draft_items.length} AI-generated items to proposal`,
    });
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
          const fileName = `${opportunity.id}/${contractorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
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

      const { data: bidSubmission, error: insertError } = await supabase
        .from('bid_submissions')
        .insert({
          bid_opportunity_id: opportunity.id,
          bidder_id: contractorId,
          bidder_type: 'contractor',
          bid_amount: parseFloat(bidAmount),
          estimated_timeline: estimatedTimeline || null,
          proposal_text: proposalText || null,
          attachments: attachmentUrls,
          status: 'submitted',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get contractor profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contractorId)
        .single();

      // Send notification to estimator
      try {
        await supabase.functions.invoke('send-bid-submission-notification', {
          body: {
            bidSubmissionId: bidSubmission.id,
            bidOpportunityId: opportunity.id,
            bidderName: profile?.full_name || 'Contractor',
            bidderType: 'contractor',
            bidAmount: parseFloat(bidAmount),
            opportunityTitle: opportunity.title,
            estimatedTimeline: estimatedTimeline || null,
          }
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the submission if notification fails
      }

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
          {/* AI Bid Draft Generation */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Bid Preparation Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="contractorNotes">Your Notes (Optional)</Label>
                <Textarea
                  id="contractorNotes"
                  placeholder="Add any notes or considerations..."
                  value={contractorNotes}
                  onChange={(e) => setContractorNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={handleGenerateAIDraft}
                disabled={generatingAI}
                className="w-full"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Bid Draft (AI)
                  </>
                )}
              </Button>

              {showAIDraft && aiDraft && (
                <div className="space-y-3 pt-3 border-t">
                  {aiDraft.draft_items && aiDraft.draft_items.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Draft Items ({aiDraft.draft_items.length})</h4>
                        <Button size="sm" variant="ghost" onClick={() => setShowAIDraft(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aiDraft.draft_items.map((item: any, idx: number) => (
                          <div key={idx} className="p-2 bg-background rounded border text-xs">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-muted-foreground flex gap-2 mt-1">
                              <span>{item.suggestedQty} {item.suggestedUnit}</span>
                              {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiDraft.missing_items && aiDraft.missing_items.length > 0 && (
                    <div className="text-xs">
                      <h4 className="font-medium text-amber-600 mb-1">Consider Addressing:</h4>
                      <ul className="text-muted-foreground space-y-1">
                        {aiDraft.missing_items.map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button type="button" size="sm" onClick={handleApplyAIDraft} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Apply to Proposal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
