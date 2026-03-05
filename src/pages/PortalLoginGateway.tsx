import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PORTAL_URLS, PORTAL_LABELS, PortalKey } from "@/config/portalUrls";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export default function PortalLoginGateway() {
  const { portal } = useParams<{ portal: PortalKey }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const portalKey: PortalKey | undefined = portal && PORTAL_URLS[portal] ? portal : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalKey) {
      toast({
        variant: "destructive",
        title: "Invalid portal",
        description: "Please use a valid portal login URL.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login successful",
        description: `Welcome to your ${PORTAL_LABELS[portalKey]}.`,
      });

      // Navigate directly to the portal
      navigate(PORTAL_URLS[portalKey]);
    } catch (err: any) {
      console.error("Portal login error", err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err?.message ?? "Please check your credentials and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!portalKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md mx-auto">
          <img src={smartRenoLogo} alt="SmartReno" className="h-12 mx-auto mb-8" />
          <h1 className="text-2xl font-semibold mb-4">Invalid Portal Link</h1>
          <p className="mb-4 text-muted-foreground">
            The portal you are trying to access doesn't exist. Please use a valid SmartReno portal link.
          </p>
          <Button onClick={() => navigate("/")}>Back to SmartReno</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <img src={smartRenoLogo} alt="SmartReno" className="h-12 mx-auto mb-8" />
        <div className="bg-card p-8 rounded-lg shadow-sm border">
          <h1 className="text-2xl font-semibold mb-2">
            Sign in to {PORTAL_LABELS[portalKey]}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your credentials to access your portal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In & Open Portal"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
