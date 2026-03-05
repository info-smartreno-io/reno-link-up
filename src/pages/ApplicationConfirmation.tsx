import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Mail, Phone, FileCheck, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ApplicationConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackingNumber = searchParams.get("tracking") || "N/A";
  const companyName = searchParams.get("company") || "your company";

  useEffect(() => {
    // Redirect if no tracking number
    if (!searchParams.get("tracking")) {
      navigate("/contractors");
    }
  }, [searchParams, navigate]);

  const timeline = [
    {
      step: 1,
      title: "Application Received",
      description: "We've received your application and all documents",
      status: "completed",
      icon: CheckCircle2,
      timeframe: "Just now",
    },
    {
      step: 2,
      title: "Review in Progress",
      description: "Our team will review your credentials and experience",
      status: "current",
      icon: FileCheck,
      timeframe: "Within 24-48 hours",
    },
    {
      step: 3,
      title: "Decision & Notification",
      description: "You'll receive an email with our decision and next steps",
      status: "upcoming",
      icon: Mail,
      timeframe: "2-3 business days",
    },
    {
      step: 4,
      title: "Onboarding (If Approved)",
      description: "Get access to the platform and start receiving leads",
      status: "upcoming",
      icon: ArrowRight,
      timeframe: "Within 1 week",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Application Submitted - SmartReno</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <SiteNavbar />

      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Application Submitted!</h1>
            <p className="text-xl text-muted-foreground">
              Thank you for applying to join the SmartReno network
            </p>
          </div>

          {/* Tracking Number Card */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Application Tracking Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="inline-block bg-muted px-6 py-3 rounded-lg">
                  <p className="text-3xl font-mono font-bold text-primary">
                    {trackingNumber}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Save this number to track your application status
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company Name:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Response:</span>
                <span className="font-medium">Within 2-3 business days</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timeline.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex gap-4">
                      {/* Icon and Line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            item.status === "completed"
                              ? "bg-green-100 border-green-600"
                              : item.status === "current"
                              ? "bg-primary/10 border-primary"
                              : "bg-muted border-border"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              item.status === "completed"
                                ? "text-green-600"
                                : item.status === "current"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-16 ${
                              item.status === "completed"
                                ? "bg-green-600"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.timeframe}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                If you have any questions about your application, feel free to reach out:
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:contractors@smartreno.com" className="text-primary hover:underline">
                  contractors@smartreno.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  Please reference your tracking number: <span className="font-mono font-semibold">{trackingNumber}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/contractors")}
              className="sm:w-auto"
            >
              Learn More About SmartReno
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="sm:w-auto"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
