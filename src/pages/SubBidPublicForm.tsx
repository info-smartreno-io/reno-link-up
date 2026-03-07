import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2, HardHat } from "lucide-react";
import { sanitizeString, sanitizeEmail, sanitizePhone } from "@/utils/sanitization";

export default function SubBidPublicForm() {
  const { projectId, trade } = useParams<{ projectId: string; trade: string }>();
  const decodedTrade = trade ? decodeURIComponent(trade) : "";

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    bid_amount: "",
    duration: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.bid_amount || !projectId) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase
        .from("subcontractor_bids" as any)
        .insert({
          project_id: projectId,
          trade: sanitizeString(decodedTrade),
          company_name: sanitizeString(form.company_name),
          contact_name: sanitizeString(form.contact_name),
          phone: form.phone ? sanitizePhone(form.phone) : null,
          email: form.email ? sanitizeEmail(form.email) : null,
          bid_amount: parseFloat(form.bid_amount),
          duration: form.duration ? sanitizeString(form.duration) : null,
          notes: form.notes ? sanitizeString(form.notes) : null,
          status: "submitted",
        }) as any);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Bid Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you, {form.company_name}. Your bid for <strong>{decodedTrade}</strong> has been received. The contractor will review and follow up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <HardHat className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Submit Bid — {decodedTrade}</CardTitle>
          <CardDescription>
            Complete the form below to submit your trade bid for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bid_amount">Bid Amount ($) *</Label>
                <Input
                  id="bid_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.bid_amount}
                  onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g. 2 weeks"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes / Scope Clarifications</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Inclusions, exclusions, special conditions..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={2000}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Bid
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
