import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  onAccept: () => Promise<void>;
  onBack: () => void;
  isPending: boolean;
}

export function ContractorTermsOfService({ onAccept, onBack, isPending }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [agreedFee, setAgreedFee] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <CardTitle>SmartReno Contractor Terms of Service</CardTitle>
        </div>
        <CardDescription>Please review and accept the terms before submitting your profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScrollArea className="h-[400px] border rounded-lg p-4">
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed pr-4">
            <section>
              <h3 className="font-semibold text-foreground mb-2">1. Platform Overview</h3>
              <p>SmartReno is a technology platform that connects homeowners with independent licensed contractors. SmartReno does not perform construction services, is not a licensed contractor, and does not employ or supervise any contractor on the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">2. Contractor Independence</h3>
              <p>Contractors using SmartReno operate as independent businesses. All work performed is under the contractor's own license, insurance, and supervision. SmartReno is not a party to any construction agreement between a contractor and a homeowner.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">3. SmartReno Platform Fee</h3>
              <p>By accepting these terms, you agree that SmartReno charges a <strong className="text-foreground">2.5% platform fee</strong> on the final signed contract amount when a project originates through the SmartReno platform. This fee is due upon execution of the homeowner construction agreement.</p>
              <p className="mt-2">SmartReno may adjust platform fees or introduce subscription plans in the future. Contractors will be notified at least 30 days prior to any fee changes taking effect.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">4. Contractor Responsibilities</h3>
              <p>Contractors agree to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Maintain all required licenses, permits, and certifications</li>
                <li>Maintain valid general liability insurance and workers compensation coverage</li>
                <li>Comply with all applicable building codes and regulations</li>
                <li>Provide accurate and timely bids to homeowners</li>
                <li>Communicate with homeowners and SmartReno staff professionally</li>
                <li>Keep profile information, insurance, and licensing up to date</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">5. Bidding & Project Conduct</h3>
              <p>Contractors must submit bids that are accurate, complete, and submitted in good faith. Bid manipulation, collusion, or intentionally misleading proposals will result in suspension or removal from the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">6. Dispute Disclaimer</h3>
              <p>SmartReno is not responsible for:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Construction performance or workmanship quality</li>
                <li>Payment disputes between contractors and homeowners</li>
                <li>Contract terms agreed upon between contractors and homeowners</li>
                <li>Subcontractor performance or payment</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">7. Platform Conduct</h3>
              <p>SmartReno reserves the right to remove contractors from the platform for:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Fraud or misrepresentation</li>
                <li>Consistently poor performance or homeowner complaints</li>
                <li>Unprofessional conduct</li>
                <li>Expired or invalid insurance or licensing</li>
                <li>Violation of these terms of service</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">8. Data & Privacy</h3>
              <p>Contractor information provided on the platform may be shared with homeowners for project matching purposes. SmartReno will not sell contractor data to third parties.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">9. Termination</h3>
              <p>Either party may terminate this agreement at any time. Active project obligations must be fulfilled regardless of termination. Outstanding platform fees remain payable after termination.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">10. Amendments</h3>
              <p>SmartReno may update these terms from time to time. Continued use of the platform after notification constitutes acceptance of updated terms.</p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} className="mt-0.5" />
            <span className="text-sm text-foreground">
              I have read and agree to the SmartReno Contractor Terms of Service.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox checked={agreedFee} onCheckedChange={(c) => setAgreedFee(!!c)} className="mt-0.5" />
            <span className="text-sm text-foreground">
              I understand and agree to the <strong>2.5% platform fee</strong> on projects originating through SmartReno.
            </span>
          </label>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button
            onClick={onAccept}
            disabled={!agreed || !agreedFee || isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Accept & Submit for Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
