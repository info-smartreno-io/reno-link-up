import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Home } from "lucide-react";

export default function HomeownerEstimateConfirmed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!sessionId) {
      navigate('/homeowner-intake');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/homeowner/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Payment Confirmed!</CardTitle>
          <CardDescription className="text-lg">
            Your estimate request has been received
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">What happens next?</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. We're assigning an estimator to your project right now</li>
                  <li>2. You'll receive an email within 1 hour to schedule your site visit</li>
                  <li>3. After the visit, you'll get your detailed SmartEstimate</li>
                  <li>4. We'll send you 3+ competitive contractor bids within 72 hours</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <p className="text-sm text-center text-green-700 dark:text-green-400">
              Check your email for next steps and calendar scheduling link
            </p>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting to your homeowner portal in {countdown} seconds...
            </p>
            <Button onClick={() => navigate('/homeowner/dashboard')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homeowner Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}