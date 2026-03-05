import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

function useQueryParam(key: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(key) ?? "", [search, key]);
}

export default function UnifiedLogin() {
  const initialRole = useQueryParam("role");
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkRoleAndRedirect(session.user.id);
      }
    });
  }, []);

  async function checkRoleAndRedirect(userId: string) {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }

    if (roles && roles.length > 0) {
      const userRole = roles[0].role;
      
      // Route based on role - open portals in new tabs
      if (userRole === 'contractor') {
        toast({
          title: "Welcome!",
          description: "Opening your contractor portal in a new tab.",
        });
        window.open('/contractor/portal', "_blank", "noopener,noreferrer");
        navigate('/');
      } else if (userRole === 'homeowner') {
        navigate('/homeowner-portal');
        toast({
          title: "Welcome!",
          description: "You're now logged in to your homeowner portal.",
        });
      } else if (userRole === 'estimator') {
        toast({
          title: "Welcome!",
          description: "Opening your estimator portal in a new tab.",
        });
        window.open('/estimator/dashboard', "_blank", "noopener,noreferrer");
        navigate('/');
      } else if (userRole === 'admin') {
        toast({
          title: "Welcome!",
          description: "Opening your admin portal in a new tab.",
        });
        window.open('/admin/dashboard', "_blank", "noopener,noreferrer");
        navigate('/');
      } else if (userRole === 'architect') {
        toast({
          title: "Welcome!",
          description: "Opening your architect portal in a new tab.",
        });
        window.open('/architect/dashboard', "_blank", "noopener,noreferrer");
        navigate('/');
      } else if (userRole === 'interior_designer') {
        toast({
          title: "Welcome!",
          description: "Opening your interior designer portal in a new tab.",
        });
        window.open('/interiordesigner/dashboard', "_blank", "noopener,noreferrer");
        navigate('/');
      } else {
        toast({
          title: "Dashboard Coming Soon",
          description: `The ${userRole.replace(/_/g, ' ')} dashboard is currently under development.`,
        });
      }
    } else {
      toast({
        title: "No Role Assigned",
        description: "Your account doesn't have a role assigned yet. Please contact an administrator.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    
    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role before signing up.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?role=${role}`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          setIsSignUp(false);
        } else {
          throw error;
        }
      } else if (data.user) {
        // Assign the role to the user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role as AppRole
          });

        if (roleError) {
          toast({
            title: "Error",
            description: "Account created but role assignment failed. Please contact an administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          setIsSignUp(false);
          setPassword("");
          setFullName("");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    
    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role before signing in.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setPending(false);
        return;
      }

      if (data.user) {
        // Verify the user has the selected role
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', role as AppRole);

        if (roleError) {
          toast({
            title: "Error",
            description: "Failed to verify your role. Please try again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setPending(false);
          return;
        }

        if (!roles || roles.length === 0) {
          toast({
            title: "Access Denied",
            description: `You don't have ${role.replace(/_/g, ' ')} access. Please select the correct role or contact an administrator.`,
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setPending(false);
          return;
        }

        toast({
          title: "Success",
          description: "Signed in successfully!",
        });

        await checkRoleAndRedirect(data.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password.",
      });
      
      setShowResetPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {showResetPassword 
                ? "Reset Password" 
                : isSignUp 
                  ? "Create SmartReno Account" 
                  : "SmartReno Login"}
            </CardTitle>
            <CardDescription>
              {showResetPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp 
                  ? "Sign up to get started with your project" 
                  : "Sign in to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showResetPassword ? (
              <form className="space-y-4" onSubmit={handlePasswordReset}>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@smartreno.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={pending}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setEmail("");
                    }}
                    className="text-primary hover:underline"
                    disabled={pending}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homeowner">Homeowner</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="interior_designer">Interior Designer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={pending}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@smartreno.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={pending}
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!role || pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp 
                  ? "Create Account" 
                  : `Sign in${role ? ` as ${role.replace(/_/g, " ")}` : ""}`}
              </Button>

              {!isSignUp && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-muted-foreground hover:text-primary hover:underline"
                    disabled={pending}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword("");
                    setFullName("");
                  }}
                  className="text-primary hover:underline"
                  disabled={pending}
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
              </form>
            )}
          </CardContent>
      </Card>
      </div>
    </div>
  );
}
