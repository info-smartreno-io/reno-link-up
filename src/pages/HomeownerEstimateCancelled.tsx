import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function HomeownerEstimateCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your estimate request was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-muted-foreground">
              No charges were made to your card. Your project information has been saved,
              and you can complete the payment whenever you're ready.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate('/homeowner-intake')} className="w-full" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Project Intake
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Homepage
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at{" "}
              <a href="mailto:support@smartreno.com" className="text-primary hover:underline">
                support@smartreno.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}