import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, FileText, Bell } from "lucide-react";

interface NotesData {
  customerNotes: string;
  internalNotes: string;
  termsAndConditions: string;
}

interface EstimateNotesTabProps {
  data: NotesData;
  onUpdate: (field: keyof NotesData, value: string) => void;
}

const DEFAULT_TERMS = `• Payment terms: 30% deposit required to begin work, 40% at midpoint, 30% upon completion
• Estimate valid for 30 days from date of issue
• Timeline subject to material availability and permit approval
• All work to be performed in accordance with local building codes
• Warranty: 1 year workmanship warranty on all labor
• Any changes to scope of work may result in additional charges
• Customer responsible for clearing work areas prior to start
• Permits and inspections included unless otherwise noted`;

export function EstimateNotesTab({ data, onUpdate }: EstimateNotesTabProps) {
  return (
    <div className="space-y-6">
      {/* Notes to Customer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Notes to Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.customerNotes}
            onChange={(e) => onUpdate('customerNotes', e.target.value)}
            placeholder="Add notes that will be visible to the customer on the estimate..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            These notes will appear on the customer-facing estimate document.
          </p>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.internalNotes}
            onChange={(e) => onUpdate('internalNotes', e.target.value)}
            placeholder="Add internal notes, reminders, or instructions for your team..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            These notes are for internal use only and will not be visible to the customer.
          </p>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.termsAndConditions || DEFAULT_TERMS}
            onChange={(e) => onUpdate('termsAndConditions', e.target.value)}
            placeholder="Enter terms and conditions..."
            rows={10}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Standard terms that will appear on the estimate. Edit as needed for this project.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { DEFAULT_TERMS };
