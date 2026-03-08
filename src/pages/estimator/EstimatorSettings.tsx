import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLogout } from "@/hooks/useLogout";
import { Settings, LogOut } from "lucide-react";

export default function EstimatorSettings() {
  const { toast } = useToast();
  const { logout } = useLogout("/estimator/auth");
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your estimator portal preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for new assignments</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
