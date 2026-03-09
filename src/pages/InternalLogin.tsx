import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export default function InternalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Check if already logged in with valid internal role
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const destination = await getInternalDestination(session.user.id);
        if (destination) {
          navigate(destination, { replace: true });
          return;
        }
      }
      setCheckingSession(false);
    });
  }, [navigate]);

  const getInternalDestination = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = data?.map((r) => r.role) || [];

    if (roles.includes("admin")) return "/admin/dashboard";
    if (roles.includes("estimator")) return "/estimator/dashboard";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) throw new Error("Login failed");

      // Check role
      const destination = await getInternalDestination(data.user.id);

      if (!destination) {
        // Not an internal user — sign them out and deny
        await supabase.auth.signOut();
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back",
        description: "Redirecting to your dashboard...",
      });

      navigate(destination, { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err?.message ?? "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={smartRenoLogo} alt="SmartReno" className="h-10 mx-auto mb-6" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartReno Internal Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure login for administrators and estimators.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessDenied && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  You do not have permission to access this portal. This login is for authorized SmartReno team members only.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@smartreno.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Authorized SmartReno team members only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
