import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamMemberMetrics {
  user_id: string;
  user_name: string;
  user_email: string;
  leads_count: number;
  walkthroughs_completed: number;
  estimates_sent: number;
  set_rate: number;
  close_rate: number;
  total_revenue: number;
  avg_ticket: number;
  rank: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read from request body instead of query params
    const body = await req.json();
    const from = body.from;
    const to = body.to;

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: from, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all leads in date range
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to);

    if (leadsError) throw leadsError;

    // Fetch all estimates in date range
    const { data: estimates, error: estimatesError } = await supabase
      .from('estimates')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to);

    if (estimatesError) throw estimatesError;

    // Fetch all walkthroughs in date range
    const { data: walkthroughs, error: walkthroughsError } = await supabase
      .from('walkthroughs')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to);

    if (walkthroughsError) throw walkthroughsError;

    // Get unique user IDs from estimates (assigned work)
    const userIds = [...new Set(estimates?.map(e => e.user_id).filter(Boolean) || [])];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Calculate metrics for each team member
    const teamMetrics: TeamMemberMetrics[] = userIds.map(userId => {
      const userProfile = profiles?.find(p => p.id === userId);
      const userEstimates = estimates?.filter(e => e.user_id === userId) || [];
      const userWalkthroughs = walkthroughs?.filter(w => w.estimator_id === userId) || [];
      const userLeads = leads?.filter(l => l.assigned_to === userId) || [];

      const leadsCount = userLeads.length;
      const walkthroughsCompleted = userWalkthroughs.filter(w => w.status === 'completed').length;
      const estimatesSent = userEstimates.filter(e => e.status === 'sent').length;
      const estimatesAccepted = userEstimates.filter(e => e.status === 'accepted').length;

      const setRate = leadsCount > 0 ? (walkthroughsCompleted / leadsCount) * 100 : 0;
      const closeRate = walkthroughsCompleted > 0 ? (estimatesAccepted / walkthroughsCompleted) * 100 : 0;
      
      const totalRevenue = userEstimates
        .filter(e => e.status === 'accepted')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      const avgTicket = estimatesAccepted > 0 ? totalRevenue / estimatesAccepted : 0;

      return {
        user_id: userId,
        user_name: userProfile?.full_name || 'Unknown',
        user_email: userProfile?.email || '',
        leads_count: leadsCount,
        walkthroughs_completed: walkthroughsCompleted,
        estimates_sent: estimatesSent,
        set_rate: setRate,
        close_rate: closeRate,
        total_revenue: totalRevenue,
        avg_ticket: avgTicket,
        rank: 0, // Will be assigned after sorting
      };
    });

    // Sort by total revenue and assign ranks
    teamMetrics.sort((a, b) => b.total_revenue - a.total_revenue);
    teamMetrics.forEach((member, index) => {
      member.rank = index + 1;
    });

    return new Response(
      JSON.stringify(teamMetrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sales-team-performance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
