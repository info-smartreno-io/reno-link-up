import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Professional role options
const professionalRoles = [
  { value: "homeowner", label: "Homeowner" },
  { value: "contractor", label: "Contractor" },
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "vendor", label: "Vendor" },
] as const;

// Validation schemas
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const phoneSchema = z.string().trim().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number").min(10).max(20).optional().or(z.literal(''));

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      // Pre-fill data from OAuth provider
      const metadata = user.user_metadata;
      if (metadata.full_name || metadata.name) {
        setFullName(metadata.full_name || metadata.name || "");
      }
      if (metadata.avatar_url) {
        setAvatarUrl(metadata.avatar_url);
      }
      
      // Check if profile is already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.profile_completed) {
        navigate("/", { replace: true });
      }
    };

    checkProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validatedName = nameSchema.parse(fullName);
      const validatedPhone = phoneSchema.parse(phone);

      if (!role) {
        throw new Error("Please select your role");
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: validatedName,
          phone: validatedPhone || null,
          bio: bio.trim() || null,
          profile_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Insert or update user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { 
            user_id: user.id, 
            role: role as any 
          },
          { 
            onConflict: 'user_id,role',
            ignoreDuplicates: false 
          }
        );

      if (roleError) throw roleError;

      toast({
        title: "Profile Completed!",
        description: "Welcome to SmartReno.",
      });

      // Role-based redirect after profile setup
      const redirectPaths: Record<string, string> = {
        homeowner: "/homeowner/dashboard",
        contractor: "/contractor/dashboard",
        architect: "/architect/dashboard",
        interior_designer: "/interiordesigner/dashboard",
        estimator: "/estimator/dashboard",
        admin: "/admin/dashboard",
        vendor: "/vendor/dashboard",
      };

      const redirectPath = redirectPaths[role] || "/";
      navigate(redirectPath, { replace: true });
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
          title: "Setup Failed",
          description: error.message || "Could not complete profile setup.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground text-lg">
              Help us personalize your SmartReno experience
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                This information helps us connect you with the right professionals and opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {avatarUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a... *</Label>
                  <Select
                    value={role}
                    onValueChange={setRole}
                    disabled={loading}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {professionalRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This helps us show you relevant content and connections
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {role && role !== "homeowner" && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your experience and expertise..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500 characters
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Why we need this information</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Personalize your dashboard and recommendations</li>
                        <li>• Connect you with relevant professionals</li>
                        <li>• Provide role-specific features and resources</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You can update this information anytime in your profile settings
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
