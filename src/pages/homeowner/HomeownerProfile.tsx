import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Home } from "lucide-react";

export default function HomeownerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    home_visit_preferences: {
      working_hours: "",
      storage_ok: "",
      bathroom_access: "",
      dumpster_location: "",
      pets_wfh: "",
    } as Record<string, string>,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("full_name, email, phone, home_visit_preferences")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          home_visit_preferences: {
            working_hours: (data.home_visit_preferences?.working_hours as string) || "",
            storage_ok: (data.home_visit_preferences?.storage_ok as string) || "",
            bathroom_access: (data.home_visit_preferences?.bathroom_access as string) || "",
            dumpster_location: (data.home_visit_preferences?.dumpster_location as string) || "",
            pets_wfh: (data.home_visit_preferences?.pets_wfh as string) || "",
          },
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          home_visit_preferences: profile.home_visit_preferences,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <Input id="email" value={profile.email} disabled className="bg-muted/50" />
            <p className="text-[10px] text-muted-foreground">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Phone
            </Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <Separator />

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            Home & Visit Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="working_hours">Preferred working hours</Label>
            <Input
              id="working_hours"
              value={profile.home_visit_preferences.working_hours}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  home_visit_preferences: { ...prev.home_visit_preferences, working_hours: e.target.value },
                }))
              }
              placeholder="e.g. Weekdays 8am–5pm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_ok">Can we store materials in your home/garage?</Label>
            <Input
              id="storage_ok"
              value={profile.home_visit_preferences.storage_ok}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  home_visit_preferences: { ...prev.home_visit_preferences, storage_ok: e.target.value },
                }))
              }
              placeholder="e.g. Yes, in the garage"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathroom_access">Bathroom access for crews</Label>
            <Input
              id="bathroom_access"
              value={profile.home_visit_preferences.bathroom_access}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  home_visit_preferences: { ...prev.home_visit_preferences, bathroom_access: e.target.value },
                }))
              }
              placeholder="e.g. Use main floor bathroom / need portable toilet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dumpster_location">Dumpster / parking location</Label>
            <Input
              id="dumpster_location"
              value={profile.home_visit_preferences.dumpster_location}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  home_visit_preferences: { ...prev.home_visit_preferences, dumpster_location: e.target.value },
                }))
              }
              placeholder="e.g. Driveway, right side"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pets_wfh">Pets / work-from-home details</Label>
            <Input
              id="pets_wfh"
              value={profile.home_visit_preferences.pets_wfh}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  home_visit_preferences: { ...prev.home_visit_preferences, pets_wfh: e.target.value },
                }))
              }
              placeholder="e.g. Dog on site, homeowner works from home"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            These preferences are shared with your estimator and project team so site visits run smoothly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
