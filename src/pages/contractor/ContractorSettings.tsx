import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/useLogout";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  User,
  Bell,
  Shield,
  Building,
  CreditCard,
  Mail,
  Loader2,
  Save,
} from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoUserSettings } from "@/utils/demoContractorData";

export default function ContractorSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useLogout("/contractor/auth");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { isDemoMode } = useDemoMode();
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    project_updates: true,
    bid_updates: true,
    warranty_updates: true,
  });

  useEffect(() => {
    if (isDemoMode) {
      const demoSettings = getDemoUserSettings();
      setProfileData({
        full_name: demoSettings.full_name,
        email: demoSettings.email,
        phone: demoSettings.phone,
        company_name: demoSettings.company_name,
      });
      setNotifications(demoSettings.notifications);
      setUser({ id: "demo-user", email: demoSettings.email });
      setLoading(false);
      return;
    }
    checkAuth();
    loadSettings();
  }, [isDemoMode]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/contractor/auth");
    } else {
      setUser(session.user);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfileData({
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        company_name: user.user_metadata?.company_name || "",
      });

      // Load notification preferences from user metadata or database
      // For now, using default values
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Profile changes are simulated in demo mode.",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          company_name: profileData.company_name,
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Notification changes are simulated in demo mode.",
      });
      return;
    }
    setSaving(true);
    try {
      // Save notification preferences to user metadata or database
      const { error } = await supabase.auth.updateUser({
        data: { notification_preferences: notifications }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error: any) {
      console.error("Error saving notifications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                  />
                </div>
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.email_notifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                    </div>
                    <Switch
                      checked={notifications.sms_notifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms_notifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={notifications.push_notifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Notification Types</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">Updates on project progress and milestones</p>
                    </div>
                    <Switch
                      checked={notifications.project_updates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, project_updates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bid Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about new bids and RFPs</p>
                    </div>
                    <Switch
                      checked={notifications.bid_updates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, bid_updates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Warranty Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about warranty claims</p>
                    </div>
                    <Switch
                      checked={notifications.warranty_updates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, warranty_updates: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationsSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Manage your company information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Company settings will be available here</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Change your password to keep your account secure
                  </p>
                  <Button variant="outline" onClick={async () => {
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
                        redirectTo: `${window.location.origin}/create-password`,
                      });
                      if (error) throw error;
                      toast({
                        title: "Password Reset Email Sent",
                        description: "Check your email for a link to reset your password.",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to send password reset email",
                        variant: "destructive",
                      });
                    }
                  }}>Change Password</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Sign Out</Label>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                  <Button variant="destructive" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}
