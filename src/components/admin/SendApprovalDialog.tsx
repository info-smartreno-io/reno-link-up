import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendApprovalDialogProps {
  selection: {
    id: string;
    project_name: string;
    client_name: string;
    category: string;
    item_description: string;
    client_phone?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SendApprovalDialog({ 
  selection, 
  open, 
  onOpenChange,
  onSuccess 
}: SendApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(selection.client_phone || "");

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      const formatted = [match[1], match[2], match[3]]
        .filter(Boolean)
        .join("-");
      return formatted;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendApproval = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-selection-approval", {
        body: {
          selectionId: selection.id,
          clientPhone: phoneNumber,
        },
      });

      if (error) throw error;

      toast.success("Approval request sent successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error sending approval request:", error);
      toast.error("Failed to send approval request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Approval Request via SMS</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selection Details</Label>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><span className="font-medium">Project:</span> {selection.project_name}</p>
              <p><span className="font-medium">Client:</span> {selection.client_name}</p>
              <p><span className="font-medium">Category:</span> {selection.category}</p>
              <p><span className="font-medium">Item:</span> {selection.item_description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Client Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="555-123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={12}
            />
            <p className="text-xs text-muted-foreground">
              Format: XXX-XXX-XXXX (US numbers only)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Message Preview:</p>
                <p className="text-xs">
                  The client will receive an SMS with the selection details and instructions 
                  to reply with APPROVE or REJECT.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendApproval}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Send SMS
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
