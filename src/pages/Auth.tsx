import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Briefcase, ArrowLeft, Loader2, Mail, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { z } from "zod";

// Professional role options
const professionalRoles = [
  { value: "contractor", label: "Contractor" },
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "vendor", label: "Vendor" },
  { value: "partner", label: "Partner" },
] as const;

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);

export default function Auth() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = searchParams.get("tab") || "homeowner";
  const navigate = useNavigate();
  const { toast } = useToast();

  // Homeowner state
  const [homeownerMode, setHomeownerMode] = useState<"signin" | "signup">("signin");
  const [homeownerEmail, setHomeownerEmail] = useState("");
  const [homeownerPassword, setHomeownerPassword] = useState("");
  const [homeownerName, setHomeownerName] = useState("");
  const [homeownerLoading, setHomeownerLoading] = useState(false);

  // Professional state
  const [professionalMode, setProfessionalMode] = useState<"signin" | "signup">("signin");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [professionalPassword, setProfessionalPassword] = useState("");
  const [professionalName, setProfessionalName] = useState("");
  const [professionalRole, setProfessionalRole] = useState<string>("");
  const [professionalLoading, setProfessionalLoading] = useState(false);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // New password state (for when user clicks reset link)
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Email verification state
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  // Magic link state
  const [showMagicLinkPrompt, setShowMagicLinkPrompt] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  // Social auth loading state
  const [socialLoading, setSocialLoading] = useState(false);

  // Redirect if already authenticated OR check if user is resetting password
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a password reset callback
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        setIsResettingPassword(true);
        return;
      }
      
      if (session) {
        // Check if user needs to complete profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_completed")
          .eq("id", session.user.id)
          .maybeSingle();

        // If profile is not completed, redirect to profile setup
        if (!profile?.profile_completed) {
          navigate("/profile-setup", { replace: true });
          return;
        }

        // Get the redirect path from location state or default to home
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    };
    checkAuth();
  }, [navigate, location]);

  // Homeowner Sign In
  const handleHomeownerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setHomeownerLoading(true);

    try {
      const email = emailSchema.parse(homeownerEmail);
      const password = passwordSchema.parse(homeownerPassword);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      // Redirect to the page they were trying to access or home
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
        });
      }
    } finally {
      setHomeownerLoading(false);
    }
  };

  // Homeowner Sign Up
  const handleHomeownerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHomeownerLoading(true);

    try {
      const email = emailSchema.parse(homeownerEmail);
      const password = passwordSchema.parse(homeownerPassword);
      const name = nameSchema.parse(homeownerName);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            role: "homeowner",
          },
        },
      });

      if (error) throw error;

      // Insert homeowner role
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "homeowner" });

        if (roleError) console.error("Role assignment error:", roleError);
      }

      // Show verification prompt instead of success message
      setVerificationEmail(email);
      setShowVerificationPrompt(true);
      setHomeownerName("");
      setHomeownerPassword("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message || "Could not create account.",
        });
      }
    } finally {
      setHomeownerLoading(false);
    }
  };

  // Professional Sign In
  const handleProfessionalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfessionalLoading(true);

    try {
      const email = emailSchema.parse(professionalEmail);
      const password = passwordSchema.parse(professionalPassword);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      // Redirect to the page they were trying to access or home
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
        });
      }
    } finally {
      setProfessionalLoading(false);
    }
  };

  // Handle password reset request
  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const email = emailSchema.parse(resetEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Reset Email Sent!",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: error.message || "Could not send reset email.",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Handle password update after clicking reset link
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPasswordLoading(true);

    try {
      const password = passwordSchema.parse(newPassword);
      
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset.",
      });

      // Clear the hash and redirect
      window.location.href = "/auth";
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Could not update password.",
        });
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendingVerification(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
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

  // Handle magic link request
  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMagicLink(true);

    try {
      const email = emailSchema.parse(magicLinkEmail);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast({
        title: "Magic Link Sent!",
        description: "Check your email for a sign-in link.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send",
          description: error.message || "Could not send magic link.",
        });
      }
    } finally {
      setSendingMagicLink(false);
    }
  };

  // Handle social authentication
  const handleSocialAuth = async (provider: 'google' | 'github' | 'apple') => {
    setSocialLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // OAuth will redirect, so we don't need to do anything here
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || `Could not sign in with ${provider}.`,
      });
      setSocialLoading(false);
    }
  };

  // Professional Sign Up
  const handleProfessionalSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfessionalLoading(true);

    try {
      const email = emailSchema.parse(professionalEmail);
      const password = passwordSchema.parse(professionalPassword);
      const name = nameSchema.parse(professionalName);

      if (!professionalRole) {
        throw new Error("Please select your professional role");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            role: professionalRole,
          },
        },
      });

      if (error) throw error;

      // Insert professional role
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: professionalRole as any });

        if (roleError) console.error("Role assignment error:", roleError);
      }

      // Show verification prompt instead of success message
      setVerificationEmail(email);
      setShowVerificationPrompt(true);
      setProfessionalName("");
      setProfessionalPassword("");
      setProfessionalRole("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message || "Could not create account.",
        });
      }
    } finally {
      setProfessionalLoading(false);
    }
  };

  // Email verification prompt
  if (showVerificationPrompt) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Verify Your Email</h1>
              <p className="text-muted-foreground text-lg">
                We've sent a verification link to
              </p>
              <p className="text-foreground font-medium mt-1">
                {verificationEmail}
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Check Your Inbox</CardTitle>
                <CardDescription>
                  Click the verification link in the email to activate your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> You must verify your email before you can sign in to SmartReno.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes for the email to arrive</li>
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
                    onClick={() => {
                      setShowVerificationPrompt(false);
                      setVerificationEmail("");
                      setHomeownerMode("signin");
                      setProfessionalMode("signin");
                    }}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              Need help? <a href="mailto:info@smartreno.io" className="text-primary hover:underline">Contact support</a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If user is resetting password (came from email link)
  if (isResettingPassword) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-2">Reset Your Password</h1>
              <p className="text-muted-foreground text-lg">Enter your new password below</p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>New Password</CardTitle>
                <CardDescription>
                  Choose a strong password that you haven't used before.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={resetPasswordLoading}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={resetPasswordLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetPasswordLoading}>
                    {resetPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  
  // Magic link prompt
  if (showMagicLinkPrompt) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => {
            setShowMagicLinkPrompt(false);
            setMagicLinkSent(false);
            setMagicLinkEmail("");
          }} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>

          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Magic Link Sign In</h1>
              <p className="text-muted-foreground text-lg">
                No password needed – we'll send you a secure link
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Passwordless Authentication</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a magic link to sign in instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {magicLinkSent ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Mail className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Magic link sent!</strong> Check your inbox at <strong>{magicLinkEmail}</strong> and click the link to sign in.
                      <div className="mt-3 text-sm">
                        <p>Didn't receive it?</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Check your spam folder</li>
                          <li>Make sure you entered the correct email</li>
                          <li>Wait a minute and try again</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-link-email">Email Address</Label>
                      <Input
                        id="magic-link-email"
                        type="email"
                        placeholder="you@example.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        required
                        disabled={sendingMagicLink}
                      />
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        <strong>How it works:</strong> We'll send a secure, one-time link to your email. Click it to sign in instantly – no password required!
                      </AlertDescription>
                    </Alert>

                    <Button type="submit" className="w-full" disabled={sendingMagicLink}>
                      {sendingMagicLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Magic Link
                    </Button>
                  </form>
                )}
                
                {magicLinkSent && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setMagicLinkSent(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Send Another Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              <p>✨ Magic links are more secure than passwords</p>
              <p className="mt-2">Need help? <a href="mailto:info@smartreno.io" className="text-primary hover:underline">Contact support</a></p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Password reset request modal/view
  if (showPasswordReset) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setShowPasswordReset(false)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>

          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-2">Reset Password</h1>
              <p className="text-muted-foreground text-lg">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Password Recovery</CardTitle>
                <CardDescription>
                  We'll send you an email with instructions to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resetSent ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Mail className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Reset email sent! Check your inbox and click the link to reset your password.
                      The link will expire in 1 hour.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        disabled={resetLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={resetLoading}>
                      {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Reset Link
                    </Button>
                  </form>
                )}
                
                {resetSent && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setResetSent(false);
                        setResetEmail("");
                      }}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to SmartReno</h1>
            <p className="text-muted-foreground text-lg">Sign in or create your account</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="homeowner" className="gap-2">
                <Home className="h-4 w-4" />
                Homeowner
              </TabsTrigger>
              <TabsTrigger value="professional" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Professional
              </TabsTrigger>
            </TabsList>

            {/* Homeowner Tab */}
            <TabsContent value="homeowner" className="max-w-md mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Homeowner Access</CardTitle>
                  <CardDescription>
                    Track your renovation project, compare bids, and manage everything in one place.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={homeownerMode === "signin" ? "default" : "outline"}
                      onClick={() => setHomeownerMode("signin")}
                      className="flex-1"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={homeownerMode === "signup" ? "default" : "outline"}
                      onClick={() => setHomeownerMode("signup")}
                      className="flex-1"
                    >
                      Sign Up
                    </Button>
                  </div>

                  {homeownerMode === "signin" ? (
                    <form onSubmit={handleHomeownerSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="homeowner-email">Email</Label>
                        <Input
                          id="homeowner-email"
                          type="email"
                          placeholder="you@example.com"
                          value={homeownerEmail}
                          onChange={(e) => setHomeownerEmail(e.target.value)}
                          required
                          disabled={homeownerLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="homeowner-password">Password</Label>
                        <Input
                          id="homeowner-password"
                          type="password"
                          placeholder="••••••••"
                          value={homeownerPassword}
                          onChange={(e) => setHomeownerPassword(e.target.value)}
                          required
                          disabled={homeownerLoading}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={homeownerLoading}>
                        {homeownerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('google')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('github')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <Github className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('apple')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                        </Button>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground">
                        <p>Continue with Google, GitHub, or Apple</p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowMagicLinkPrompt(true);
                          setMagicLinkEmail(homeownerEmail);
                        }}
                        disabled={socialLoading}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Sign In with Magic Link
                      </Button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => setShowPasswordReset(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleHomeownerSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="homeowner-name">Full Name</Label>
                        <Input
                          id="homeowner-name"
                          type="text"
                          placeholder="John Doe"
                          value={homeownerName}
                          onChange={(e) => setHomeownerName(e.target.value)}
                          required
                          disabled={homeownerLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="homeowner-signup-email">Email</Label>
                        <Input
                          id="homeowner-signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={homeownerEmail}
                          onChange={(e) => setHomeownerEmail(e.target.value)}
                          required
                          disabled={homeownerLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="homeowner-signup-password">Password</Label>
                        <Input
                          id="homeowner-signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={homeownerPassword}
                          onChange={(e) => setHomeownerPassword(e.target.value)}
                          required
                          disabled={homeownerLoading}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                      </div>
                      <Button type="submit" className="w-full" disabled={homeownerLoading}>
                        {homeownerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Tab */}
            <TabsContent value="professional" className="max-w-md mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Professional Access</CardTitle>
                  <CardDescription>
                    Join our network of contractors, architects, designers, and vendors.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={professionalMode === "signin" ? "default" : "outline"}
                      onClick={() => setProfessionalMode("signin")}
                      className="flex-1"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={professionalMode === "signup" ? "default" : "outline"}
                      onClick={() => setProfessionalMode("signup")}
                      className="flex-1"
                    >
                      Sign Up
                    </Button>
                  </div>

                  {professionalMode === "signin" ? (
                    <form onSubmit={handleProfessionalSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="professional-email">Email</Label>
                        <Input
                          id="professional-email"
                          type="email"
                          placeholder="you@company.com"
                          value={professionalEmail}
                          onChange={(e) => setProfessionalEmail(e.target.value)}
                          required
                          disabled={professionalLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professional-password">Password</Label>
                        <Input
                          id="professional-password"
                          type="password"
                          placeholder="••••••••"
                          value={professionalPassword}
                          onChange={(e) => setProfessionalPassword(e.target.value)}
                          required
                          disabled={professionalLoading}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={professionalLoading}>
                        {professionalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('google')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('github')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <Github className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialAuth('apple')}
                          disabled={socialLoading}
                          className="w-full"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                        </Button>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground">
                        <p>Continue with Google, GitHub, or Apple</p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowMagicLinkPrompt(true);
                          setMagicLinkEmail(professionalEmail);
                        }}
                        disabled={socialLoading}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Sign In with Magic Link
                      </Button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => setShowPasswordReset(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleProfessionalSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="professional-role">I am a...</Label>
                        <Select
                          value={professionalRole}
                          onValueChange={setProfessionalRole}
                          disabled={professionalLoading}
                        >
                          <SelectTrigger id="professional-role">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {professionalRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professional-name">Full Name / Business Name</Label>
                        <Input
                          id="professional-name"
                          type="text"
                          placeholder="John Doe / ABC Construction"
                          value={professionalName}
                          onChange={(e) => setProfessionalName(e.target.value)}
                          required
                          disabled={professionalLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professional-signup-email">Email</Label>
                        <Input
                          id="professional-signup-email"
                          type="email"
                          placeholder="you@company.com"
                          value={professionalEmail}
                          onChange={(e) => setProfessionalEmail(e.target.value)}
                          required
                          disabled={professionalLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professional-signup-password">Password</Label>
                        <Input
                          id="professional-signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={professionalPassword}
                          onChange={(e) => setProfessionalPassword(e.target.value)}
                          required
                          disabled={professionalLoading}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                      </div>
                      <Button type="submit" className="w-full" disabled={professionalLoading}>
                        {professionalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Professional Account
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            Need help? <a href="mailto:info@smartreno.io" className="text-primary hover:underline">Contact support</a>
          </div>
        </div>
      </div>
    </main>
  );
}
