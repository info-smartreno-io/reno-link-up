import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portal-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const portalToken = req.headers.get('x-portal-token');
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!portalToken) {
      return new Response(
        JSON.stringify({ error: 'Portal access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and check project access
    const { data: access, error: accessError } = await supabase
      .from('homeowner_portal_access')
      .select('*')
      .eq('access_token', portalToken)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (accessError || !access) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get photos from walkthrough_photos table
    const { data: walkthroughPhotos } = await supabase
      .from('walkthrough_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Get photos from daily_logs
    const { data: dailyLogs } = await supabase
      .from('daily_logs')
      .select('id, log_date, photos, notes')
      .eq('project_id', projectId)
      .not('photos', 'is', null)
      .order('log_date', { ascending: false });

    // Combine and format photos
    const photos: any[] = [];

    // Add walkthrough photos
    if (walkthroughPhotos) {
      walkthroughPhotos.forEach(photo => {
        photos.push({
          id: photo.id,
          url: photo.photo_url,
          thumbnail_url: photo.photo_url, // Could add thumbnail logic
          caption: photo.notes || 'Project photo',
          category: photo.room_area || 'General',
          taken_at: photo.created_at,
          source: 'walkthrough',
        });
      });
    }

    // Add daily log photos
    if (dailyLogs) {
      dailyLogs.forEach(log => {
        const logPhotos = log.photos as string[];
        if (logPhotos && Array.isArray(logPhotos)) {
          logPhotos.forEach((photoUrl, index) => {
            photos.push({
              id: `${log.id}-${index}`,
              url: photoUrl,
              thumbnail_url: photoUrl,
              caption: log.notes || `Daily progress - ${log.log_date}`,
              category: 'Progress',
              taken_at: log.log_date,
              source: 'daily_log',
            });
          });
        }
      });
    }

    // Sort by date, most recent first
    photos.sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime());

    console.log(`Returning ${photos.length} photos for project: ${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total_count: photos.length,
        photos 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal photos error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
