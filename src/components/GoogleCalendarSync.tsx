import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, RefreshCw, Loader2, CheckCircle2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface GoogleCalendarSyncProps {
  userId?: string;
  autoSync?: boolean;
}

export function GoogleCalendarSync({ userId: propUserId, autoSync = true }: GoogleCalendarSyncProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncSettings, setSyncSettings] = useState({
    syncSchedules: true,
    syncTasks: true,
    syncWalkthroughs: true,
    autoSyncEnabled: autoSync,
  });

  useEffect(() => {
    const getUser = async () => {
      if (!propUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } else {
        setUserId(propUserId);
      }
    };
    getUser();
  }, [propUserId]);

  useEffect(() => {
    if (userId) {
      checkConnectionStatus();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !syncSettings.autoSyncEnabled || !isConnected) return;

    // Listen for real-time updates to schedules
    const scheduleChannel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractor_schedule',
        },
        async (payload) => {
          console.log('Schedule changed:', payload);
          if (syncSettings.syncSchedules && accessToken) {
            await syncEventToGoogle(payload.new, 'schedule');
          }
        }
      )
      .subscribe();

    // Listen for task changes
    const taskChannel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foreman_tasks',
        },
        async (payload) => {
          console.log('Task changed:', payload);
          if (syncSettings.syncTasks && accessToken) {
            await syncEventToGoogle(payload.new, 'task');
          }
        }
      )
      .subscribe();

    // Listen for walkthrough changes
    const walkthroughChannel = supabase
      .channel('walkthrough-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walkthroughs',
        },
        async (payload) => {
          console.log('Walkthrough changed:', payload);
          if (syncSettings.syncWalkthroughs && accessToken) {
            await syncEventToGoogle(payload.new, 'walkthrough');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(walkthroughChannel);
    };
  }, [userId, isConnected, accessToken, syncSettings]);

  const checkConnectionStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const expiresAt = new Date(data.expires_at);
        if (expiresAt > new Date()) {
          setIsConnected(true);
          setAccessToken(data.access_token);
          
          // Register webhook for two-way sync
          await registerWebhook(data.access_token);
        } else {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const registerWebhook = async (token: string) => {
    try {
      await supabase.functions.invoke('google-calendar-register-webhook', {
        body: { accessToken: token, userId }
      });
      console.log('Webhook registered successfully');
    } catch (error) {
      console.error('Error registering webhook:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    const googleClientId = await getGoogleClientId();
    if (!googleClientId) {
      toast.error('Google Calendar integration not configured');
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    
    const scope = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${googleClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  };

  const getGoogleClientId = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_client_id' }
      });
      if (error) throw error;
      return data?.clientId || null;
    } catch (error) {
      console.error('Error getting client ID:', error);
      return null;
    }
  };

  const handleOAuthCallback = async () => {
    if (!userId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) return;

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          code,
          redirectUri: `${window.location.origin}${window.location.pathname}`,
          action: 'exchange_code'
        }
      });

      if (error) throw error;

      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      
      await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expiresAt.toISOString(),
        });

      setIsConnected(true);
      setAccessToken(data.access_token);

      window.history.replaceState({}, document.title, window.location.pathname);

      toast.success('Connected to Google Calendar', {
        description: 'Your calendar will now sync automatically'
      });

      await syncFromGoogleCalendar();
      await registerWebhook(data.access_token);
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error('Connection Failed', {
        description: 'Failed to connect to Google Calendar'
      });
    }
  };

  const syncEventToGoogle = async (event: any, type: string) => {
    if (!accessToken) return;

    try {
      await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'push',
          accessToken,
          event,
          eventType: type,
        }
      });
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
    }
  };

  const syncFromGoogleCalendar = async () => {
    if (!accessToken || !userId) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'pull',
          accessToken,
          userId,
          syncSettings,
        }
      });

      if (error) throw error;

      setLastSyncTime(new Date());
      toast.success('Sync Complete', {
        description: 'Events synced from Google Calendar'
      });
    } catch (error) {
      console.error('Error syncing from Google Calendar:', error);
      toast.error('Sync Failed', {
        description: 'Failed to sync from Google Calendar'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('google_calendar_webhooks')
        .delete()
        .eq('user_id', userId);

      setIsConnected(false);
      setAccessToken(null);

      toast.success('Disconnected from Google Calendar');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  useEffect(() => {
    handleOAuthCallback();
  }, [userId]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
            <Calendar className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-medium">Google Calendar</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Connected & Auto-Syncing
                </span>
              ) : (
                'Not connected'
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sync Settings</DialogTitle>
                    <DialogDescription>
                      Choose which events to sync with Google Calendar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-sync">Auto-sync enabled</Label>
                      <Switch
                        id="auto-sync"
                        checked={syncSettings.autoSyncEnabled}
                        onCheckedChange={(checked) => 
                          setSyncSettings(prev => ({ ...prev, autoSyncEnabled: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-schedules">Sync schedules</Label>
                      <Switch
                        id="sync-schedules"
                        checked={syncSettings.syncSchedules}
                        onCheckedChange={(checked) => 
                          setSyncSettings(prev => ({ ...prev, syncSchedules: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-tasks">Sync tasks</Label>
                      <Switch
                        id="sync-tasks"
                        checked={syncSettings.syncTasks}
                        onCheckedChange={(checked) => 
                          setSyncSettings(prev => ({ ...prev, syncTasks: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-walkthroughs">Sync walkthroughs</Label>
                      <Switch
                        id="sync-walkthroughs"
                        checked={syncSettings.syncWalkthroughs}
                        onCheckedChange={(checked) => 
                          setSyncSettings(prev => ({ ...prev, syncWalkthroughs: checked }))
                        }
                      />
                    </div>
                    <Button variant="destructive" onClick={disconnectGoogleCalendar} className="w-full">
                      Disconnect Google Calendar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={syncFromGoogleCalendar}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Sync Now</span>
              </Button>
            </>
          ) : (
            <Button onClick={connectGoogleCalendar} size="sm">
              Connect
            </Button>
          )}
        </div>
      </div>

      {lastSyncTime && (
        <p className="text-xs text-muted-foreground mt-2">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}
