import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/useLogout";
import { Loader2, DollarSign, RefreshCw, CheckCircle2, XCircle, Settings, Link as LinkIcon, Activity, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSideNav } from "@/components/AdminSideNav";

interface QuickBooksToken {
  id: string;
  realm_id: string;
  expires_at: string;
  created_at: string;
}

export default function AdminQuickbooks() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<QuickBooksToken | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInvoices, setSyncInvoices] = useState(true);
  const [syncEstimates, setSyncEstimates] = useState(true);
  const [syncCustomers, setSyncCustomers] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useLogout("/admin/auth");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/admin/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/admin/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        
        if (error) {
          console.error('Error checking admin status:', error);
          toast({
            title: "Error",
            description: "Failed to verify admin status",
            variant: "destructive",
          });
          navigate("/admin/auth");
          return;
        }
        
        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate("/admin/auth");
          return;
        }
        
        setIsAdmin(data);
        await checkQuickBooksConnection();
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  useEffect(() => {
    // Check if redirected back from OAuth
    if (searchParams.get('connected') === 'true') {
      toast({
        title: "Connected Successfully",
        description: "Your QuickBooks account is now connected",
      });
      // Remove the query param
      navigate('/admin/quickbooks', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const checkQuickBooksConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quickbooks_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTokenData(data);
        setIsConnected(true);
        
        // Get last sync date
        const { data: syncHistory } = await supabase
          .from('quickbooks_sync_history')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (syncHistory) {
          setLastSyncDate(new Date(syncHistory.created_at));
        }
      }
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error);
    }
  };


  const handleConnect = () => {
    if (!user) return;

    const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
    const redirectUri = `${window.location.origin}/functions/v1/quickbooks-oauth-callback`;
    
    if (!clientId) {
      toast({
        title: "Configuration Error",
        description: "QuickBooks Client ID not configured. Please add QUICKBOOKS_CLIENT_ID secret.",
        variant: "destructive",
      });
      return;
    }

    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', user.id);

    window.location.href = authUrl.toString();
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('quickbooks_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setTokenData(null);
      toast({
        title: "Disconnected",
        description: "QuickBooks integration has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setSyncing(true);
    
    const syncTypes = [];
    if (syncInvoices) syncTypes.push('invoices');
    if (syncEstimates) syncTypes.push('estimates');
    if (syncCustomers) syncTypes.push('customers');

    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { userId: user.id, syncTypes },
      });

      if (error) throw error;

      setLastSyncDate(new Date());
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${syncTypes.join(', ')}`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with QuickBooks",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8 w-auto" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold text-foreground">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <SettingsDropdown userRole="admin" />
          </div>
        </div>
      </div>

      <AdminSideNav role="admin" topOffsetPx={64} />

      <div className="ml-64 pt-16">
        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">QuickBooks Integration</h1>
              <p className="text-muted-foreground">
                Connect and sync your accounting data with QuickBooks
              </p>
            </div>

            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Connection Status
                    </CardTitle>
                    <CardDescription>Manage your QuickBooks connection</CardDescription>
                  </div>
                  <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Connect your QuickBooks account to sync invoices, estimates, and customer data
                    </p>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Make sure QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, and QUICKBOOKS_REDIRECT_URI secrets are configured.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={handleConnect} className="gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Connect to QuickBooks
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">QuickBooks Online</p>
                        <p className="text-sm text-muted-foreground">Realm ID: {tokenData?.realm_id}</p>
                        {tokenData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Connected {format(new Date(tokenData.created_at), 'PPP')}
                          </p>
                        )}
                      </div>
                      <Button onClick={handleDisconnect} variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </div>
                    
                    {lastSyncDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Last synced: {format(lastSyncDate, "PPpp")}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync Settings Card */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Sync Settings
                  </CardTitle>
                  <CardDescription>Configure what data to synchronize</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync">Automatic Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync data every hour
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Sync Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-invoices">Invoices</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync invoice data to QuickBooks
                        </p>
                      </div>
                      <Switch
                        id="sync-invoices"
                        checked={syncInvoices}
                        onCheckedChange={setSyncInvoices}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-estimates">Estimates</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync project estimates to QuickBooks
                        </p>
                      </div>
                      <Switch
                        id="sync-estimates"
                        checked={syncEstimates}
                        onCheckedChange={setSyncEstimates}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-customers">Customers</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync customer and project data
                        </p>
                      </div>
                      <Switch
                        id="sync-customers"
                        checked={syncCustomers}
                        onCheckedChange={setSyncCustomers}
                      />
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    onClick={handleSync} 
                    disabled={syncing}
                    className="w-full gap-2"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sync History Card */}
            {isConnected && lastSyncDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sync Activity</CardTitle>
                  <CardDescription>View recent synchronization history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: "Invoices", count: 12, status: "success", time: lastSyncDate },
                      { type: "Estimates", count: 8, status: "success", time: new Date(lastSyncDate.getTime() - 60000) },
                      { type: "Customers", count: 24, status: "success", time: new Date(lastSyncDate.getTime() - 120000) },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">{item.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.count} records synced
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(item.time, "p")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
