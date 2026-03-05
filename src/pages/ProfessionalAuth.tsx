import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Briefcase, ArrowLeft, Loader2, Mail, Github, CheckCircle } from "lucide-react";
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
] as const;

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);

export default function ProfessionalAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<"signin" | "network">("network");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [professionalPassword, setProfessionalPassword] = useState("");
  const [professionalName, setProfessionalName] = useState("");
  const [professionalRole, setProfessionalRole] = useState<string>("");
  const [professionalLoading, setProfessionalLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Network application form fields
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("");
  const [region, setRegion] = useState("");
  const [website, setWebsite] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, location]);

  // Handle social authentication
  const handleSocialAuth = async (provider: 'google' | 'github' | 'apple') => {
    setSocialLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/profile-setup`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || `Could not sign in with ${provider}.`,
      });
      setSocialLoading(false);
    }
  };

  // Professional Sign In
  const handleProfessionalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfessionalLoading(true);

    try {
      const email = emailSchema.parse(professionalEmail);
      const password = passwordSchema.parse(professionalPassword);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

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

  // Professional Sign Up with Network Application
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
          emailRedirectTo: `${window.location.origin}/profile-setup`,
          data: {
            full_name: name,
            role: professionalRole,
            company_name: companyName,
            phone: phone,
            trade: trade,
            region: region,
            website: website,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: professionalRole as any });

        if (roleError) console.error("Role assignment error:", roleError);
      }

      toast({
        title: "Account Created!",
        description: "Check your email to verify your account.",
      });

      setProfessionalName("");
      setProfessionalPassword("");
      setProfessionalRole("");
      setCompanyName("");
      setPhone("");
      setTrade("");
      setRegion("");
      setWebsite("");
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

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
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

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Join the SmartReno Professional Network</h1>
            <p className="text-muted-foreground text-lg">
              Connect with homeowners, win projects, and grow your business
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={authMode === "network" ? "default" : "outline"}
                  onClick={() => setAuthMode("network")}
                  className="flex-1"
                >
                  Join Network
                </Button>
                <Button
                  variant={authMode === "signin" ? "default" : "outline"}
                  onClick={() => setAuthMode("signin")}
                  className="flex-1"
                >
                  Sign In
                </Button>
              </div>

              <CardTitle>
                {authMode === "network" && "Apply to Join Our Network"}
                {authMode === "signin" && "Professional Sign In"}
              </CardTitle>
              <CardDescription>
                {authMode === "network" && "Complete this form to apply as a professional"}
                {authMode === "signin" && "Sign in to access your professional dashboard"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Network Application Form */}
              {authMode === "network" && (
                <form onSubmit={handleProfessionalSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a... *</Label>
                    <Select
                      value={professionalRole}
                      onValueChange={setProfessionalRole}
                      disabled={professionalLoading}
                    >
                      <SelectTrigger id="role">
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
                    <Label htmlFor="company">Company/Firm Name *</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Acme Renovations"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={professionalLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">Contact Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        value={professionalName}
                        onChange={(e) => setProfessionalName(e.target.value)}
                        required
                        disabled={professionalLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={professionalEmail}
                        onChange={(e) => setProfessionalEmail(e.target.value)}
                        required
                        disabled={professionalLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(201) 555-1212"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={professionalLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade">Trade/Specialty</Label>
                      <Input
                        id="trade"
                        type="text"
                        placeholder="General Contractor, Architect..."
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                        disabled={professionalLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="region">Service Area</Label>
                      <Input
                        id="region"
                        type="text"
                        placeholder="Bergen, Passaic, Morris..."
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        disabled={professionalLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        disabled={professionalLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={professionalPassword}
                      onChange={(e) => setProfessionalPassword(e.target.value)}
                      required
                      disabled={professionalLoading}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                    <p className="text-sm font-medium">What you'll get:</p>
                    <div className="grid gap-2">
                      {[
                        "Access to qualified project leads",
                        "Direct communication with homeowners",
                        "Project management tools",
                        "Professional network connections"
                      ].map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={professionalLoading}>
                    {professionalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By applying, you agree to be contacted about SmartReno's Professional Network
                  </p>
                </form>
              )}

              {/* Sign In Form */}
              {authMode === "signin" && (
                <form onSubmit={handleProfessionalSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@company.com"
                      value={professionalEmail}
                      onChange={(e) => setProfessionalEmail(e.target.value)}
                      required
                      disabled={professionalLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
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
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('github')}
                      disabled={socialLoading}
                    >
                      <Github className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('apple')}
                      disabled={socialLoading}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </Button>
                  </div>
                </form>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
