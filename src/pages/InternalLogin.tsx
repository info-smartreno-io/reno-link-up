import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

/**
 * Resolve the internal dashboard destination based on user roles.
 * Priority: admin > estimator. Returns null if no internal role found.
 */
async function resolveInternalDestination(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Role lookup error:", error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    const roles = data.map((r) => r.role);

    // Admin takes priority over estimator
    if (roles.includes("admin")) return "/admin/dashboard";
    if (roles.includes("estimator")) return "/estimator/dashboard";

    return null;
  } catch (err) {
    console.error("Role lookup failed:", err);
    return null;
  }
}

export { resolveInternalDestination };

export default function InternalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkExistingSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session check error:", error.message);
        setCheckingSession(false);
        return;
      }

      if (session?.user) {
        const destination = await resolveInternalDestination(session.user.id);
        if (destination) {
          navigate(destination, { replace: true });
          return;
        }
        // User is logged in but has no internal role — sign them out
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setCheckingSession(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkExistingSession();

    // Listen for auth state changes (e.g. token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setCheckingSession(false);
        }
        if (event === "TOKEN_REFRESHED" && session?.user) {
          const destination = await resolveInternalDestination(session.user.id);
          if (!destination) {
            await supabase.auth.signOut();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkExistingSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Invalid email or password. Please try again.");
        } else {
          setErrorMessage(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check role with priority: admin > estimator
      const destination = await resolveInternalDestination(data.user.id);

      if (!destination) {
        // Not an internal user — sign them out and deny access
        await supabase.auth.signOut();
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back",
        description: "Redirecting to your dashboard…",
      });

      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage(
        "Unable to connect to authentication service. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying session…</p>
        </div>
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
            Secure login for administrators and Construction Agents.
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
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You do not have permission to access this portal. This login is restricted to authorized SmartReno administrators and Construction Agents only.
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && !accessDenied && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                    setAccessDenied(false);
                  }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
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
