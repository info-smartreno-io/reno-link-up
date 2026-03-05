import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { PermitFormDocumentUpload } from "./PermitFormDocumentUpload";

interface PermitFormRowProps {
  form: {
    id: string;
    form_code: string;
    form_name: string;
    authority: string;
    status: string;
    auto_filled: boolean;
    document_file_path?: string;
  };
  onFormUpdate: () => void;
}

const FORM_STATUS_CONFIG = {
  not_started: { label: "Not Started", variant: "secondary" as const },
  auto_filled: { label: "Auto-filled", variant: "default" as const },
  uploaded: { label: "Uploaded", variant: "default" as const },
  submitted: { label: "Submitted", variant: "default" as const },
  approved: { label: "Approved", variant: "default" as const },
};

export function PermitFormRow({ form, onFormUpdate }: PermitFormRowProps) {
  const statusConfig = FORM_STATUS_CONFIG[form.status as keyof typeof FORM_STATUS_CONFIG];

  const handlePrint = () => {
    // In a real implementation, this would open a print dialog for the document
    window.print();
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{form.form_name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {form.form_code}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{form.authority}</span>
      </TableCell>
      <TableCell>
        <Badge variant={statusConfig?.variant || "secondary"}>
          {statusConfig?.label || form.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PermitFormDocumentUpload
            permitRequiredFormId={form.id}
            currentDocumentPath={form.document_file_path}
            onUploadComplete={onFormUpdate}
          />
          {form.document_file_path && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
