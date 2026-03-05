import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ResolveClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (notes: string) => Promise<void>;
  claimNumber: string;
}

export function ResolveClaimDialog({
  open,
  onOpenChange,
  onResolve,
  claimNumber,
}: ResolveClaimDialogProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleResolve = async () => {
    setSaving(true);
    try {
      await onResolve(notes);
      setNotes("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resolve Claim</DialogTitle>
          <DialogDescription>
            Mark claim {claimNumber} as resolved
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea
              placeholder="Describe the resolution..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
