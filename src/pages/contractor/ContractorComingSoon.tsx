import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2, Shield, ClipboardList, Users } from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function ContractorApply() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in your name, email, and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      const userId = authData.user.id;

      // 2. Assign contractor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "contractor" });

      if (roleError && roleError.code !== "23505") {
        console.error("Role assignment error:", roleError);
      }

      // 3. Create contractor application record
      const { error: appError } = await supabase
        .from("contractor_applications")
        .insert({
          user_id: userId,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          company_name: companyName.trim() || null,
          status: "pending",
        });

      if (appError && appError.code !== "23505") {
        console.error("Application error:", appError);
      }

      // 4. Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          role: "contractor",
        });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Try signing in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <div className="flex-1 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left — Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Apply to the SmartReno Network
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Join our vetted contractor network and receive pre-scoped residential renovation projects in Northern New Jersey.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  { icon: ClipboardList, title: "Pre-Scoped Projects", desc: "Every project comes with a detailed scope of work and budget range." },
                  { icon: Users, title: "Qualified Homeowners", desc: "Homeowners are pre-qualified and ready to move forward." },
                  { icon: Shield, title: "Free to Join", desc: "No subscription fees. Complete your profile and start receiving bid invitations." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-foreground underline hover:no-underline">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Right — Form */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">
                  {submitted ? "Application Submitted" : "Get Started"}
                </CardTitle>
                {!submitted && (
                  <CardDescription>
                    Create your account, then complete your profile in the portal.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Smith Construction LLC"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@smithconstruction.com"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(201) 555-0100"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Create Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        disabled={loading}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" size="lg" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Apply Now
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By applying, you agree to SmartReno's Terms of Service.
                    </p>
                  </form>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="flex justify-center">
                      <div className="bg-primary/10 p-4 rounded-full">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">You're in!</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Check your email to verify your account, then sign in to complete your contractor profile and start receiving bid invitations.
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                      size="lg"
                    >
                      Sign In to Complete Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
