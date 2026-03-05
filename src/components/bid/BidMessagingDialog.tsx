import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BidMessaging } from "./BidMessaging";

interface BidMessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityTitle: string;
}

export const BidMessagingDialog = ({
  open,
  onOpenChange,
  opportunityId,
  opportunityTitle,
}: BidMessagingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Messages</DialogTitle>
          <DialogDescription>
            Discuss this opportunity with the estimator
          </DialogDescription>
        </DialogHeader>
        <BidMessaging
          opportunityId={opportunityId}
          opportunityTitle={opportunityTitle}
        />
      </DialogContent>
    </Dialog>
  );
};
