import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, Users, DollarSign } from "lucide-react";
import { retargetingPixels } from "@/utils/retargetingPixels";

export function RetargetingManager() {
  const [loading, setLoading] = useState(false);
  const [pixelConfig, setPixelConfig] = useState({
    fbPixelId: '',
    tiktokPixelId: '',
    googleAdsId: '',
  });
  const [audiences, setAudiences] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    conversions: 0,
    totalValue: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAudiences();
    loadStats();
  }, []);

  const loadAudiences = async () => {
    const { data } = await supabase
      .from('retargeting_audiences')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAudiences(data);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('conversion_events')
      .select('event_type, conversion_value');
    
    if (data) {
      setStats({
        totalEvents: data.length,
        conversions: data.filter(e => e.event_type === 'intake_complete').length,
        totalValue: data.reduce((sum, e) => sum + (e.conversion_value || 0), 0),
      });
    }
  };

  const initializePixels = () => {
    if (!pixelConfig.fbPixelId && !pixelConfig.tiktokPixelId && !pixelConfig.googleAdsId) {
      toast({
        title: "Missing Pixel IDs",
        description: "Please enter at least one pixel ID",
        variant: "destructive",
      });
      return;
    }

    retargetingPixels.init(pixelConfig);
    
    toast({
      title: "Pixels Initialized",
      description: "Retargeting pixels are now active",
    });
  };

  const createAudience = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('retargeting_audiences').insert({
        audience_name: 'Abandoned Intake',
        audience_type: 'abandoned_intake',
        description: 'Users who started but did not complete intake',
        criteria: {
          event_types: ['intake_start'],
          exclude_event_types: ['intake_complete'],
          time_window: '7d',
        },
        is_active: true,
      } as any);

      if (error) throw error;

      await loadAudiences();
      toast({
        title: "Audience Created",
        description: "New retargeting audience has been created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Retargeting Pixel Configuration
          </CardTitle>
          <CardDescription>
            Configure Facebook, TikTok, and Google Ads pixels for retargeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Facebook Pixel ID</Label>
              <Input
                placeholder="123456789012345"
                value={pixelConfig.fbPixelId}
                onChange={(e) => setPixelConfig({ ...pixelConfig, fbPixelId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>TikTok Pixel ID</Label>
              <Input
                placeholder="ABCDEFGHIJK"
                value={pixelConfig.tiktokPixelId}
                onChange={(e) => setPixelConfig({ ...pixelConfig, tiktokPixelId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Google Ads ID</Label>
              <Input
                placeholder="AW-123456789"
                value={pixelConfig.googleAdsId}
                onChange={(e) => setPixelConfig({ ...pixelConfig, googleAdsId: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={initializePixels} className="w-full">
            Initialize Pixels
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Retargeting Audiences</CardTitle>
              <CardDescription>Manage your retargeting audience segments</CardDescription>
            </div>
            <Button onClick={createAudience} disabled={loading}>
              Create Audience
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audiences.map((audience) => (
              <div key={audience.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{audience.audience_name}</h3>
                      <Badge variant={audience.is_active ? "default" : "secondary"}>
                        {audience.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{audience.description}</p>
                    <div className="flex gap-2 mt-2">
                      {audience.fb_audience_id && (
                        <Badge variant="outline">Facebook</Badge>
                      )}
                      {audience.tiktok_audience_id && (
                        <Badge variant="outline">TikTok</Badge>
                      )}
                      {audience.google_audience_id && (
                        <Badge variant="outline">Google</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{audience.estimated_size || 0}</div>
                    <div className="text-xs text-muted-foreground">Users</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
