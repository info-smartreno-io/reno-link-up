import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment received</CardTitle>
          <CardDescription className="text-base">
            Thank you. Your payment has been processed. You will receive a confirmation by email if we have your address on file.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Return to SmartReno
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/payments">Pay another invoice</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
