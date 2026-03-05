import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KpiTimeseriesPoint {
  label: string;
  leads: number;
  setRate: number;
  closeRate: number;
  avgTicket: number;
  grossMargin: number;
}

interface SalesKpiResponse {
  periodLabel: string;
  points: KpiTimeseriesPoint[];
  summary: {
    leads: number;
    setRate: number;
    closeRate: number;
    avgTicket: number;
    grossMargin: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read from request body instead of query params
    const body = await req.json();
    const from = body.from;
    const to = body.to;
    const groupBy = body.groupBy || 'daily'; // daily, weekly, monthly, quarterly, yearly

    if (!from || !to) {
      throw new Error('Missing from or to date parameters');
    }

    console.log('Fetching sales KPIs from', from, 'to', to, 'groupBy', groupBy);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get leads data
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('created_at, status')
      .gte('created_at', from)
      .lte('created_at', to);

    if (leadsError) throw leadsError;

    // Get estimates data
    const { data: estimatesData, error: estimatesError } = await supabase
      .from('estimates')
      .select('created_at, status, amount')
      .gte('created_at', from)
      .lte('created_at', to);

    if (estimatesError) throw estimatesError;

    // Get walkthroughs data
    const { data: walkthroughsData, error: walkthroughsError } = await supabase
      .from('walkthroughs')
      .select('created_at, status')
      .gte('created_at', from)
      .lte('created_at', to);

    if (walkthroughsError) throw walkthroughsError;

    // Helper to get group key from date
    const getGroupKey = (dateStr: string): string => {
      const date = new Date(dateStr);
      
      switch (groupBy) {
        case 'weekly': {
          const firstDay = new Date(date.getFullYear(), 0, 1);
          const daysSince = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
          const week = Math.ceil((daysSince + firstDay.getDay() + 1) / 7);
          return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        }
        case 'monthly':
          return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        case 'quarterly': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `${date.getFullYear()}-Q${quarter}`;
        }
        case 'yearly':
          return `${date.getFullYear()}`;
        default: // daily
          return dateStr.split('T')[0];
      }
    };

    const getGroupLabel = (key: string): string => {
      if (groupBy === 'weekly') {
        const [year, week] = key.split('-W');
        return `Wk ${week}, ${year}`;
      }
      if (groupBy === 'monthly') {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (groupBy === 'quarterly') {
        return key.replace('-', ' ');
      }
      if (groupBy === 'yearly') {
        return key;
      }
      // daily
      const date = new Date(key);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // Process data by group
    const groupMap = new Map<string, KpiTimeseriesPoint>();

    // Count leads per group
    leadsData?.forEach((lead) => {
      const groupKey = getGroupKey(lead.created_at);
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          label: getGroupLabel(groupKey),
          leads: 0,
          setRate: 0,
          closeRate: 0,
          avgTicket: 0,
          grossMargin: 0,
        });
      }
      const point = groupMap.get(groupKey)!;
      point.leads += 1;
    });

    // Calculate set rate (walkthroughs scheduled / leads)
    const walkthroughsByGroup = new Map<string, number>();
    walkthroughsData?.forEach((wt) => {
      const groupKey = getGroupKey(wt.created_at);
      walkthroughsByGroup.set(groupKey, (walkthroughsByGroup.get(groupKey) || 0) + 1);
    });

    // Calculate close rate and avg ticket
    const closedByGroup = new Map<string, { count: number; total: number }>();
    estimatesData?.forEach((est) => {
      if (est.status === 'approved') {
        const groupKey = getGroupKey(est.created_at);
        const current = closedByGroup.get(groupKey) || { count: 0, total: 0 };
        current.count += 1;
        current.total += Number(est.amount);
        closedByGroup.set(groupKey, current);
      }
    });

    // Update metrics for each group
    groupMap.forEach((point, groupKey) => {
      const walkthroughs = walkthroughsByGroup.get(groupKey) || 0;
      const closed = closedByGroup.get(groupKey) || { count: 0, total: 0 };

      point.setRate = point.leads > 0 ? (walkthroughs / point.leads) * 100 : 0;
      point.closeRate = walkthroughs > 0 ? (closed.count / walkthroughs) * 100 : 0;
      point.avgTicket = closed.count > 0 ? closed.total / closed.count : 0;
      point.grossMargin = point.avgTicket > 0 ? 45 + Math.random() * 10 : 0; // Mock margin
    });

    // Calculate summary and sort points
    const points = Array.from(groupMap.values()).sort((a, b) => {
      // Extract sortable keys
      const extractKey = (label: string) => {
        if (label.startsWith('Wk')) {
          const match = label.match(/Wk (\d+), (\d+)/);
          return match ? `${match[2]}-W${match[1].padStart(2, '0')}` : label;
        }
        return label;
      };
      return extractKey(a.label).localeCompare(extractKey(b.label));
    });
    const totalLeads = points.reduce((sum, p) => sum + p.leads, 0);
    const totalWalkthroughs = walkthroughsData?.length || 0;
    const totalClosed = estimatesData?.filter(e => e.status === 'approved').length || 0;
    const totalRevenue = estimatesData
      ?.filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const summary = {
      leads: totalLeads,
      setRate: totalLeads > 0 ? (totalWalkthroughs / totalLeads) * 100 : 0,
      closeRate: totalWalkthroughs > 0 ? (totalClosed / totalWalkthroughs) * 100 : 0,
      avgTicket: totalClosed > 0 ? totalRevenue / totalClosed : 0,
      grossMargin: 47.0, // Mock
    };

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const periodLabel = fromDate.getMonth() === toDate.getMonth()
      ? `${fromDate.toLocaleString('default', { month: 'short' })} ${fromDate.getFullYear()}`
      : `${fromDate.toLocaleString('default', { month: 'short' })} - ${toDate.toLocaleString('default', { month: 'short' })} ${fromDate.getFullYear()}`;

    const response: SalesKpiResponse = {
      periodLabel,
      points,
      summary,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in sales-kpis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
