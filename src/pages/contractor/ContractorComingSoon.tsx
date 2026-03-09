import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export default function ContractorComingSoon() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("contractor_waitlist")
        .insert({ 
          email: email.trim().toLowerCase(),
          source: "contractor_portal"
        });

      if (error) {
        if (error.code === "23505") {
          // Duplicate email
          toast({
            title: "Already on the list!",
            description: "This email is already registered for our priority list.",
          });
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast({
          title: "You're on the list!",
          description: "We'll notify you when the platform is ready.",
        });

        // Send notification email to info@smartreno.io
        try {
          await supabase.functions.invoke("send-waitlist-notification", {
            body: {
              email: email.trim().toLowerCase(),
              source: "contractor_portal"
            }
          });
        } catch (notifyError) {
          // Don't fail the user's signup if notification fails
          console.error("Failed to send waitlist notification:", notifyError);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={smartRenoLogo} alt="SmartReno" className="h-12" />
          </div>
          
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Clock className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div>
            <CardTitle className="text-3xl font-bold text-primary">
              COMING SOON
            </CardTitle>
            <CardDescription className="text-base mt-2">
              The SmartReno Contractor Portal is launching soon!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!submitted ? (
            <>
              <p className="text-center text-muted-foreground">
                Enter your email to be put on our <strong>priority list</strong> once the platform is ready!
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="text-center"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Join Priority List
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">You're on the list!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  We'll send you an email when the contractor portal is ready.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
