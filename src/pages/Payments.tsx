import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Payments() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = invoiceNumber.trim();
    if (!trimmed) {
      toast.error("Please enter your invoice number.");
      return;
    }
    setLoading(true);
    try {
      const body: { invoiceNumber: string; amountCents?: number } = { invoiceNumber: trimmed };
      const amount = amountDue.trim() ? parseFloat(amountDue) : undefined;
      if (amount != null && !Number.isNaN(amount) && amount > 0) {
        body.amountCents = Math.round(amount * 100);
      }
      const { data, error } = await supabase.functions.invoke("create-invoice-checkout", {
        body,
      });
      if (error) throw error;
      const url = data?.url;
      if (url) {
        trackEvent("invoice_payment_started", { invoice_number: trimmed, category: "Homeowner" });
        window.location.href = url;
        return;
      }
      const errMsg = data?.error || "Could not start checkout. Please try again.";
      toast.error(errMsg);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">SmartReno Payment Portal</CardTitle>
          <CardDescription>
            Enter your invoice number and amount due to pay securely by credit card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice #</Label>
              <Input
                id="invoiceNumber"
                type="text"
                placeholder="e.g. INV-2024-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount due (optional)</Label>
              <Input
                id="amountDue"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1500.00 — leave blank for full balance"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay with card
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            You will be redirected to Stripe to complete payment. SmartReno does not store your card details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
