import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Bell, Shield, HelpCircle, Phone, FileText, ExternalLink } from "lucide-react";

const NOTIFICATION_KEYS = {
  emailUpdates: "homeowner_settings_email_updates",
  smsReminders: "homeowner_settings_sms_reminders",
  marketing: "homeowner_settings_marketing",
} as const;

export default function HomeownerSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [preferredContact, setPreferredContact] = useState<string>("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setEmailUpdates(localStorage.getItem(NOTIFICATION_KEYS.emailUpdates) !== "false");
        setSmsReminders(localStorage.getItem(NOTIFICATION_KEYS.smsReminders) !== "false");
        setMarketing(localStorage.getItem(NOTIFICATION_KEYS.marketing) === "true");

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_communication")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.preferred_communication) {
          setPreferredContact(profile.preferred_communication);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleNotificationChange = (key: keyof typeof NOTIFICATION_KEYS, value: boolean) => {
    localStorage.setItem(NOTIFICATION_KEYS[key], String(value));
    if (key === "emailUpdates") setEmailUpdates(value);
    if (key === "smsReminders") setSmsReminders(value);
    if (key === "marketing") setMarketing(value);
    toast({ title: "Saved", description: "Notification preference updated." });
  };

  const handlePreferredContact = async (value: string) => {
    setPreferredContact(value);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_communication: value, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      return;
    }
    toast({ title: "Saved", description: "Preferred contact method updated." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Use at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can sign in with your new password next time." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message ?? "Could not update password." });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/homeowner/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Notifications, security, and support</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose how you want to hear about project updates and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email updates</Label>
                <p className="text-xs text-muted-foreground">Project updates, messages, and visit confirmations</p>
              </div>
              <Switch
                checked={emailUpdates}
                onCheckedChange={(v) => handleNotificationChange("emailUpdates", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS reminders</Label>
                <p className="text-xs text-muted-foreground">Site visit and appointment reminders</p>
              </div>
              <Switch
                checked={smsReminders}
                onCheckedChange={(v) => handleNotificationChange("smsReminders", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Tips & offers</Label>
                <p className="text-xs text-muted-foreground">Renovation tips and occasional offers from SmartReno</p>
              </div>
              <Switch
                checked={marketing}
                onCheckedChange={(v) => handleNotificationChange("marketing", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred contact method</Label>
              <Select value={preferredContact} onValueChange={handlePreferredContact}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="either">Either</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Change your password or manage account security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="new_password">New password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm new password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Same as above"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={savingPassword || !newPassword || newPassword !== confirmPassword}>
                {savingPassword ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Support
            </CardTitle>
            <CardDescription>
              Get help from the SmartReno team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/homeowner/messages")}
            >
              <HelpCircle className="h-4 w-4" />
              Help Center (message support)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <a href="tel:12017889502">
                <Phone className="h-4 w-4" />
                Call support: (201) 788-9502
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* About / Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              About
            </CardTitle>
            <CardDescription>
              Terms and privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="https://smartreno.io/terms"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://smartreno.io/privacy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
