import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PermitFeeManagementProps {
  permitId: string;
  projectId?: string;
  municipality: string;
  state: string;
  squareFootage?: number;
  projectValue?: number;
}

export function PermitFeeManagement({
  permitId,
  projectId,
  municipality,
  state,
  squareFootage,
  projectValue,
}: PermitFeeManagementProps) {
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [actualFee, setActualFee] = useState("");
  const [feePaid, setFeePaid] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPermitFees();
  }, [permitId]);

  const loadPermitFees = async () => {
    try {
      const { data, error } = await supabase
        .from("permits" as any)
        .select("calculated_fee, actual_fee, fee_paid, invoice_id")
        .eq("id", permitId)
        .single();

      if (error) throw error;

      if (data) {
        setCalculatedFee((data as any).calculated_fee);
        setActualFee(((data as any).actual_fee?.toString() || ""));
        setFeePaid((data as any).fee_paid || false);
        setInvoiceId((data as any).invoice_id);
      }
    } catch (error: any) {
      console.error("Error loading permit fees:", error);
    }
  };

  const calculateFee = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("calculate_permit_fee" as any, {
        p_state: state,
        p_municipality: municipality,
        p_permit_type: "building",
        p_square_footage: squareFootage,
        p_project_value: projectValue,
      });

      if (error) throw error;

      const feeAmount = typeof data === 'number' ? data : 0;
      setCalculatedFee(feeAmount);
      setActualFee(feeAmount.toString());

      // Save calculated fee to permit
      await supabase
        .from("permits" as any)
        .update({ calculated_fee: feeAmount })
        .eq("id", permitId);

      toast.success("Permit fee calculated", {
        description: `Estimated fee: $${feeAmount.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error("Error calculating fee:", error);
      toast.error("Failed to calculate permit fee");
    } finally {
      setLoading(false);
    }
  };

  const saveActualFee = async () => {
    try {
      const feeAmount = parseFloat(actualFee);
      if (isNaN(feeAmount)) {
        toast.error("Please enter a valid fee amount");
        return;
      }

      const { error } = await supabase
        .from("permits" as any)
        .update({ actual_fee: feeAmount })
        .eq("id", permitId);

      if (error) throw error;

      toast.success("Permit fee updated");
    } catch (error: any) {
      console.error("Error saving fee:", error);
      toast.error("Failed to save permit fee");
    }
  };

  const createInvoiceForPermitFee = async () => {
    if (!projectId) {
      toast.error("Project ID is required to create invoice");
      return;
    }

    setCreating(true);
    try {
      const feeAmount = parseFloat(actualFee) || calculatedFee || 0;
      
      if (feeAmount <= 0) {
        toast.error("Please set a valid permit fee amount");
        return;
      }

      // Get project details
      const { data: project, error: projectError } = await supabase
        .from("projects" as any)
        .select("homeowner_name, homeowner_email, address")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Create invoice
      const invoiceNumber = `PERMIT-${Date.now()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices" as any)
        .insert({
          project_id: projectId,
          invoice_number: invoiceNumber,
          client_name: (project as any).homeowner_name,
          client_email: (project as any).homeowner_email,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: dueDate.toISOString().split("T")[0],
          status: "sent",
          subtotal: feeAmount,
          tax_amount: 0,
          total_amount: feeAmount,
          amount_paid: 0,
          notes: `Building permit fee for ${municipality}, ${state}`,
          line_items: [
            {
              description: `Building Permit Fee - ${municipality}`,
              quantity: 1,
              rate: feeAmount,
              amount: feeAmount,
            },
          ],
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Link invoice to permit
      const { error: updateError } = await supabase
        .from("permits" as any)
        .update({ invoice_id: (invoice as any).id })
        .eq("id", permitId);

      if (updateError) throw updateError;

      setInvoiceId((invoice as any).id);
      toast.success("Invoice created for permit fee", {
        description: `Invoice #${invoiceNumber}`,
      });
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const markAsPaid = async () => {
    try {
      const { error } = await supabase
        .from("permits" as any)
        .update({
          fee_paid: true,
          fee_paid_at: new Date().toISOString(),
        })
        .eq("id", permitId);

      if (error) throw error;

      setFeePaid(true);
      toast.success("Permit fee marked as paid");
    } catch (error: any) {
      console.error("Error marking fee as paid:", error);
      toast.error("Failed to update payment status");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Permit Fee Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Calculated Fee</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-md px-3 py-2">
                {calculatedFee !== null ? (
                  <span className="text-lg font-semibold">
                    ${calculatedFee.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not calculated</span>
                )}
              </div>
              <Button
                onClick={calculateFee}
                disabled={loading}
                variant="outline"
              >
                Calculate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {municipality} fee schedule
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualFee">Actual Fee (if different)</Label>
            <div className="flex gap-2">
              <Input
                id="actualFee"
                type="number"
                step="0.01"
                value={actualFee}
                onChange={(e) => setActualFee(e.target.value)}
                placeholder="Enter actual fee"
              />
              <Button onClick={saveActualFee} variant="outline">
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {feePaid ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unpaid
              </Badge>
            )}
            {invoiceId && (
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/admin/invoicing`)}
              >
                <FileText className="h-4 w-4 mr-1" />
                View Invoice
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!invoiceId && (
              <Button
                onClick={createInvoiceForPermitFee}
                disabled={creating || !actualFee}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            )}
            {!feePaid && (
              <Button onClick={markAsPaid} variant="default">
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        {squareFootage && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Fee calculation based on: {squareFootage} sq ft
            {projectValue && ` • Project value: $${projectValue.toLocaleString()}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
