import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar } from "lucide-react";

interface SendToBidRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectType: string;
  location: string;
  estimatedBudget?: number;
  squareFootage?: number;
  onSuccess?: () => void;
}

export function SendToBidRoomDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectType,
  location,
  estimatedBudget,
  squareFootage,
  onSuccess,
}: SendToBidRoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(projectName);
  const [description, setDescription] = useState("");
  const [bidDeadline, setBidDeadline] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [openToArchitects, setOpenToArchitects] = useState(false);
  const [openToContractors, setOpenToContractors] = useState(false);
  const [openToInteriorDesigners, setOpenToInteriorDesigners] = useState(false);
  const [requirements, setRequirements] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!openToArchitects && !openToContractors && !openToInteriorDesigners) {
      toast({
        title: "Selection Required",
        description: "Please select at least one professional type to send this bid to.",
        variant: "destructive",
      });
      return;
    }

    if (!bidDeadline) {
      toast({
        title: "Bid Deadline Required",
        description: "Please set a bid submission deadline.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse requirements into array
      const requirementsArray = requirements
        .split('\n')
        .filter(r => r.trim())
        .map(r => ({ text: r.trim() }));

      const { error } = await supabase
        .from('bid_opportunities')
        .insert({
          project_id: projectId,
          title,
          description,
          project_type: projectType,
          location,
          estimated_budget: estimatedBudget,
          square_footage: squareFootage,
          deadline: projectDeadline || null,
          bid_deadline: new Date(bidDeadline).toISOString(),
          created_by: user.id,
          open_to_architects: openToArchitects,
          open_to_contractors: openToContractors,
          open_to_interior_designers: openToInteriorDesigners,
          requirements: requirementsArray,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project sent to bid room successfully!",
      });

      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setDescription("");
      setBidDeadline("");
      setProjectDeadline("");
      setOpenToArchitects(false);
      setOpenToContractors(false);
      setOpenToInteriorDesigners(false);
      setRequirements("");
    } catch (error) {
      console.error('Error sending to bid room:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send project to bid room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send to Bid Room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the project scope, requirements, and expectations..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bid-deadline">Bid Submission Deadline *</Label>
              <Input
                id="bid-deadline"
                type="datetime-local"
                value={bidDeadline}
                onChange={(e) => setBidDeadline(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="project-deadline">Project Deadline (optional)</Label>
              <Input
                id="project-deadline"
                type="date"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Send to Professional Types *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="architects"
                  checked={openToArchitects}
                  onCheckedChange={(checked) => setOpenToArchitects(checked as boolean)}
                />
                <label htmlFor="architects" className="text-sm font-medium cursor-pointer">
                  Architects
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contractors"
                  checked={openToContractors}
                  onCheckedChange={(checked) => setOpenToContractors(checked as boolean)}
                />
                <label htmlFor="contractors" className="text-sm font-medium cursor-pointer">
                  Contractors
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="interior-designers"
                  checked={openToInteriorDesigners}
                  onCheckedChange={(checked) => setOpenToInteriorDesigners(checked as boolean)}
                />
                <label htmlFor="interior-designers" className="text-sm font-medium cursor-pointer">
                  Interior Designers
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Licensed and insured&#10;Minimum 5 years experience&#10;References required"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter each requirement on a new line
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Project Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span> {projectType}
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span> {location}
              </div>
              {estimatedBudget && (
                <div>
                  <span className="text-muted-foreground">Budget:</span> ${estimatedBudget.toLocaleString()}
                </div>
              )}
              {squareFootage && (
                <div>
                  <span className="text-muted-foreground">Size:</span> {squareFootage} sq ft
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send to Bid Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
