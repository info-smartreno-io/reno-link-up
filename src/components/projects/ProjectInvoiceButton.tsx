import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2 } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";

interface ProjectInvoiceButtonProps {
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  estimatedValue?: number | null;
  onInvoiceCreated?: () => void;
}

export function ProjectInvoiceButton({
  projectId,
  projectName,
  clientName,
  clientEmail = "",
  clientAddress = "",
  estimatedValue,
  onInvoiceCreated,
}: ProjectInvoiceButtonProps) {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const handleInvoiceSuccess = () => {
    setShowInvoiceDialog(false);
    onInvoiceCreated?.();
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowInvoiceDialog(true)}
      >
        <Receipt className="h-4 w-4 mr-2" />
        Create Invoice
      </Button>

      <CreateInvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        onSuccess={handleInvoiceSuccess}
      />
    </>
  );
}
