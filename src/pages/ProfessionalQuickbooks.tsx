import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";

export default function ProfessionalQuickbooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInvoices: true,
    syncEstimates: true,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quickbooks_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsConnected(true);
        setConnectionDetails(data);
      }
    } catch (error: any) {
      console.error('Error checking QuickBooks connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to connect QuickBooks.",
        });
        return;
      }

      const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_QUICKBOOKS_REDIRECT_URI || 
        `${window.location.origin}/quickbooks/callback`;

      if (!clientId) {
        toast({
          variant: "destructive",
          title: "Configuration error",
          description: "QuickBooks integration is not configured. Please contact support.",
        });
        return;
      }

      const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
        `client_id=${clientId}&` +
        `scope=com.intuit.quickbooks.accounting&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `state=${user.id}`;

      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect to QuickBooks.",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('quickbooks_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setConnectionDetails(null);

      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect QuickBooks.",
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const syncTypes = [];
      if (syncSettings.syncInvoices) syncTypes.push('invoices');
      if (syncSettings.syncEstimates) syncTypes.push('estimates');

      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { userId: user.id, syncTypes }
      });

      if (error) throw error;

      toast({
        title: "Sync completed",
        description: "Your QuickBooks data has been synced successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: error.message || "Failed to sync with QuickBooks.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">QuickBooks Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect your QuickBooks account to sync invoices and estimates
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            QuickBooks integration allows you to automatically sync your invoices and estimates.
            Contact your administrator if you need help with the setup.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Manage your QuickBooks connection</CardDescription>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Not Connected
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                {connectionDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Realm ID:</span>
                      <span className="font-mono">{connectionDetails.realm_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected:</span>
                      <span>{new Date(connectionDetails.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex gap-2">
                  <Button onClick={handleSync} disabled={isSyncing} className="flex-1">
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDisconnect} variant="destructive">
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleConnect} className="w-full">
                Connect to QuickBooks
              </Button>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>Configure what data to sync with QuickBooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data every hour
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={syncSettings.autoSync}
                  onCheckedChange={(checked) =>
                    setSyncSettings({ ...syncSettings, autoSync: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-invoices">Sync Invoices</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep invoices in sync with QuickBooks
                  </p>
                </div>
                <Switch
                  id="sync-invoices"
                  checked={syncSettings.syncInvoices}
                  onCheckedChange={(checked) =>
                    setSyncSettings({ ...syncSettings, syncInvoices: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-estimates">Sync Estimates</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep estimates in sync with QuickBooks
                  </p>
                </div>
                <Switch
                  id="sync-estimates"
                  checked={syncSettings.syncEstimates}
                  onCheckedChange={(checked) =>
                    setSyncSettings({ ...syncSettings, syncEstimates: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
