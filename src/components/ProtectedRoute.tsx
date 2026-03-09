import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { isAdminSubdomain } from "@/utils/subdomain";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Optional: require specific role
  requiredRoles?: string[]; // Optional: require any of multiple roles
  requireSalesAccess?: boolean; // Optional: require sales performance access
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles,
  requireSalesAccess = false 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check role if required
        if (session?.user && (requiredRole || requiredRoles || requireSalesAccess)) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setLoading(false);
        }
        
        if (!session) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && (requiredRole || requiredRoles || requireSalesAccess)) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
      
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [requiredRole, requiredRoles, requireSalesAccess]);

  const checkUserRole = async (userId: string) => {
    try {
      // Check both user_roles and contractor_users tables
      const [userRolesResult, contractorRolesResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId),
        supabase
          .from("contractor_users")
          .select("role")
          .eq("user_id", userId)
          .eq("is_active", true)
      ]);

      if (userRolesResult.error && contractorRolesResult.error) {
        console.error("Error checking roles:", userRolesResult.error, contractorRolesResult.error);
        setHasRequiredRole(false);
        return;
      }

      const userRolesData = userRolesResult.data || [];
      const contractorRolesData = contractorRolesResult.data || [];
      
      // Combine roles from both tables
      const allRoles = [
        ...userRolesData.map((row: any) => row.role),
        ...contractorRolesData.map((row: any) => row.role)
      ];

      let hasRole = false;
      
      // Check for specific required role
      if (requiredRole) {
        hasRole = allRoles.includes(requiredRole);
      }
      
      // Check for any of multiple required roles
      if (requiredRoles && !hasRole) {
        hasRole = requiredRoles.some(role => allRoles.includes(role));
      }
      
      // Check for sales access (contractor_admin, contractor_sales_manager, or admin)
      if (requireSalesAccess && !hasRole) {
        const salesRoles = ['admin', 'contractor_admin', 'contractor_sales_manager'];
        hasRole = salesRoles.some(role => allRoles.includes(role));
      }
      
      setHasRequiredRole(hasRole);
    } catch (error) {
      console.error("Error checking role:", error);
      setHasRequiredRole(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to appropriate auth page
  if (!user || !session) {
    // On admin subdomain, always redirect to internal login (root /)
    if (isAdminSubdomain()) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    
    const authPath = requiredRole === "admin" 
      ? "/admin/auth" 
      : requiredRole === "estimator" 
      ? "/estimator/auth"
      : requiredRole === "contractor"
      ? "/contractor/auth"
      : requiredRole === "design_professional"
      ? "/design-professional/auth"
      : "/auth";
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  // Email not verified - show verification prompt
  if (user && !user.email_confirmed_at) {
    const handleResendVerification = async () => {
      setResendingVerification(true);
      
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email!,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) throw error;

        toast({
          title: "Email Sent!",
          description: "Check your inbox for the verification link.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to Send",
          description: error.message || "Could not resend verification email.",
        });
      } finally {
        setResendingVerification(false);
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Email Verification Required</h1>
            <p className="text-muted-foreground">
              Please verify your email address to continue
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We sent a verification link to <strong>{user.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Click the verification link in the email to activate your account and access this page.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email?
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Check your spam or junk folder</li>
                  <li>Wait a few minutes for the email to arrive</li>
                  <li>Try resending the verification email</li>
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full"
                  disabled={resendingVerification}
                >
                  {resendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resend Verification Email
                </Button>
                
                <Button
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();

                    if (error) {
                      // Ignore errors - session may already be invalid
                      console.log("ProtectedRoute sign out:", error.message || error);
                    }

                    try {
                      localStorage.removeItem("sb-pscsnsgvfjcbldomnstb-auth-token");
                    } catch (storageError) {
                      console.log("ProtectedRoute storage cleanup:", storageError);
                    }

                    window.location.href = "/auth";
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>

              <div className="text-center pt-4">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            Need help? <a href="mailto:info@smartreno.io" className="text-primary hover:underline">Contact support</a>
          </div>
        </div>
      </div>
    );
  }

  // Check role if required
  if ((requiredRole || requiredRoles || requireSalesAccess) && !hasRequiredRole) {
    const roleMessage = requireSalesAccess 
      ? "sales performance access (Contractor Admin or Sales Manager role)"
      : requiredRoles 
      ? `one of these roles: ${requiredRoles.join(", ")}`
      : `the "${requiredRole}" role`;
      
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. This page requires {roleMessage}.
          </p>
          <a href="/" className="text-primary hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Authenticated and has required role (if specified) - render children
  return <>{children}</>;
}
