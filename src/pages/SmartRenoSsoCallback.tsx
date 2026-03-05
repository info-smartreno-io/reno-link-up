import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SMARTRENO_SSO_CONFIG } from "@/config/smartRenoSso";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CallbackStatus = 'processing' | 'success' | 'error';

export default function SmartRenoSsoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      // Validate state for CSRF protection
      const storedState = sessionStorage.getItem("smartreno_oauth_state");
      if (!state || state !== storedState) {
        throw new Error("Invalid OAuth state. Please try again.");
      }

      if (!code) {
        throw new Error("No authorization code received from SmartReno.");
      }

      // Exchange code for tokens (would call edge function in production)
      // const { data, error: tokenError } = await supabase.functions.invoke('smartreno-sso-exchange', {
      //   body: { code, redirect_uri: `${window.location.origin}/auth/smartreno/callback` }
      // });

      // For now, show that this flow would work
      console.log("OAuth callback received:", { code, state });
      
      // In production:
      // 1. Exchange code for SmartReno access token
      // 2. Get user info from SmartReno
      // 3. Create/update Supabase user
      // 4. Link accounts
      // 5. Redirect to dashboard

      setStatus('success');
      
      // Get return URL
      const returnUrl = sessionStorage.getItem("smartreno_return_url") || SMARTRENO_SSO_CONFIG.redirectAfterLogin;
      
      // Clean up session storage
      sessionStorage.removeItem("smartreno_oauth_state");
      sessionStorage.removeItem("smartreno_return_url");

      toast({
        title: "SSO Login Successful",
        description: "You've been authenticated via SmartReno.",
      });

      // Redirect after short delay to show success state
      setTimeout(() => {
        navigate(returnUrl);
      }, 1500);

    } catch (error: any) {
      console.error("SmartReno OAuth callback error:", error);
      setStatus('error');
      setErrorMessage(error.message || "Authentication failed");
      
      toast({
        variant: "destructive",
        title: "SSO Login Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>
            {status === 'processing' && "Processing SSO Login..."}
            {status === 'success' && "Login Successful!"}
            {status === 'error' && "Login Failed"}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && "Please wait while we complete your SmartReno authentication."}
            {status === 'success' && "Redirecting you to your dashboard..."}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'processing' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/auth/smartreno")}>
                  Try Again
                </Button>
                <Button onClick={() => navigate("/contractor/auth")}>
                  Standard Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
