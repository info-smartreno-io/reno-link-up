import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WebhookHealth {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  channel_id: string;
  resource_id: string;
  calendar_id: string;
  expiration: string;
  created_at: string;
  updated_at: string;
}

export const WebhookHealthDashboard = () => {
  const [webhooks, setWebhooks] = useState<WebhookHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
    
    // Realtime subscription for webhook changes
    const channel = supabase
      .channel('webhook-health-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'google_calendar_webhooks'
        },
        () => {
          fetchWebhooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data: webhooksData, error } = await supabase
        .from('google_calendar_webhooks')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .order('expiration', { ascending: true });

      if (error) throw error;

      // Fetch user emails from auth.users
      const userIds = webhooksData?.map(w => w.user_id) || [];
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const userMap = new Map<string, string | undefined>();
      if (users && users.length > 0) {
        users.forEach((u: any) => userMap.set(u.id, u.email));
      }

      const enrichedWebhooks = webhooksData?.map(webhook => ({
        ...webhook,
        user_email: userMap.get(webhook.user_id) || 'Unknown',
        user_name: (webhook.profiles as any)?.full_name || 'Unknown'
      })) || [];

      setWebhooks(enrichedWebhooks as WebhookHealth[]);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationStatus = (expiration: string) => {
    const expirationDate = new Date(expiration);
    const now = new Date();
    const hoursUntilExpiry = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 0) {
      return { status: 'expired', color: 'destructive', icon: WifiOff };
    } else if (hoursUntilExpiry < 24) {
      return { status: 'expiring-soon', color: 'warning', icon: AlertCircle };
    } else {
      return { status: 'active', color: 'success', icon: CheckCircle2 };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Webhook Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading webhook status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Webhook Health Monitor
        </CardTitle>
        <CardDescription>
          Active Google Calendar webhook subscriptions and sync status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhooks.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active webhooks. Team members need to connect their Google Calendar to enable real-time sync.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => {
              const { status, color, icon: StatusIcon } = getExpirationStatus(webhook.expiration);
              const expirationDate = new Date(webhook.expiration);
              
              return (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${
                      color === 'destructive' ? 'text-destructive' :
                      color === 'warning' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <div>
                      <p className="font-medium">{webhook.user_name}</p>
                      <p className="text-sm text-muted-foreground">{webhook.user_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {status === 'expired' 
                            ? 'Expired' 
                            : `Expires ${formatDistanceToNow(expirationDate, { addSuffix: true })}`
                          }
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {expirationDate.toLocaleString()}
                      </p>
                    </div>
                    
                    <Badge variant={
                      color === 'destructive' ? 'destructive' :
                      color === 'warning' ? 'outline' :
                      'default'
                    }>
                      {status === 'expired' ? 'Expired' :
                       status === 'expiring-soon' ? 'Expiring Soon' :
                       'Active'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Webhooks automatically renew daily at 2 AM. Active webhooks enable instant calendar sync.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
