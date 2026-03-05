import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SMARTRENO_SSO_CONFIG, MOCK_SMARTRENO_USERS } from "@/config/smartRenoSso";
import { Loader2, Building2, Shield, ExternalLink } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export default function SmartRenoSsoLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const returnUrl = searchParams.get("returnUrl") || SMARTRENO_SSO_CONFIG.redirectAfterLogin;

  const handleMockSsoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock SSO: Validate against mock users
      const mockUser = MOCK_SMARTRENO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!mockUser) {
        throw new Error("Invalid SmartReno credentials. Try demo@allinonehome.com / demo123");
      }

      // Create or sign in to Supabase with the mock user
      // In production, this would exchange the SmartReno OAuth token for a Supabase session
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: mockUser.email,
        password: mockUser.password,
      });

      // If user doesn't exist, create them
      if (authError?.message?.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: mockUser.email,
          password: mockUser.password,
          options: {
            data: {
              full_name: mockUser.name,
              smartreno_id: mockUser.smartreno_id,
              company: mockUser.company,
              sso_provider: 'smartreno',
            },
          },
        });

        if (signUpError) throw signUpError;

        // Store SmartReno SSO link
        if (signUpData.user) {
          await storeSmartRenoLink(signUpData.user.id, mockUser);
        }
      } else if (authError) {
        throw authError;
      }

      toast({
        title: "SmartReno SSO Login Successful",
        description: `Welcome back, ${mockUser.name}!`,
      });

      // Redirect to contractor dashboard
      navigate(returnUrl);
    } catch (error: any) {
      console.error("SmartReno SSO error:", error);
      toast({
        variant: "destructive",
        title: "SSO Login Failed",
        description: error.message || "Unable to authenticate with SmartReno",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveSsoLogin = () => {
    // When SmartReno provides OAuth, this will redirect to their authorization URL
    const state = crypto.randomUUID();
    sessionStorage.setItem("smartreno_oauth_state", state);
    sessionStorage.setItem("smartreno_return_url", returnUrl);

    const authUrl = new URL(SMARTRENO_SSO_CONFIG.authorizationUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", "YOUR_CLIENT_ID"); // From secrets
    authUrl.searchParams.set("redirect_uri", `${window.location.origin}/auth/smartreno/callback`);
    authUrl.searchParams.set("scope", SMARTRENO_SSO_CONFIG.scopes.join(" "));
    authUrl.searchParams.set("state", state);

    // window.location.href = authUrl.toString();
    toast({
      title: "Live SSO Not Configured",
      description: "SmartReno OAuth credentials are not yet available. Using mock SSO.",
    });
  };

  const storeSmartRenoLink = async (userId: string, mockUser: typeof MOCK_SMARTRENO_USERS[0]) => {
    // Store the SmartReno <-> Supabase user link for future reference
    // This would be used to sync data and maintain the SSO relationship
    console.log("Linking SmartReno account:", { userId, smartreno_id: mockUser.smartreno_id });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={smartRenoLogo} alt="SmartReno" className="h-10" />
          </div>
          <div>
            <CardTitle className="text-2xl">SmartReno SSO Login</CardTitle>
            <CardDescription className="mt-2">
              Sign in with your SmartReno contractor account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {SMARTRENO_SSO_CONFIG.mode === 'mock' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">Development Mode</p>
              <p className="text-muted-foreground mt-1">
                Using mock SSO. Try: <code className="bg-muted px-1 rounded">demo@allinonehome.com</code> / <code className="bg-muted px-1 rounded">demo123</code>
              </p>
            </div>
          )}

          <form onSubmit={handleMockSsoLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">SmartReno Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contractor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">SmartReno Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In with SmartReno
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/contractor/auth")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Standard Contractor Login
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              SmartReno SSO is for All-In-One Home Solutions contractors.{" "}
              <a href="#" className="text-primary hover:underline">
                Learn more <ExternalLink className="inline h-3 w-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
