import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { timeRangeHours = 24 } = await req.json().catch(() => ({}));

    console.log(`Starting error log analysis for last ${timeRangeHours} hours`);

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('ai_error_log_reports')
      .insert({
        status: 'running',
        time_range_hours: timeRangeHours,
      })
      .select()
      .single();

    if (reportError || !report) {
      throw new Error(`Failed to create report: ${reportError?.message}`);
    }

    const reportId = report.id;
    const timeThreshold = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

    // Fetch edge function logs
    const edgeFunctionErrors = await fetchEdgeFunctionErrors(supabase, timeThreshold);
    
    // Fetch database errors
    const databaseErrors = await fetchDatabaseErrors(supabase, timeThreshold);
    
    // Fetch auth errors
    const authErrors = await fetchAuthErrors(supabase, timeThreshold);

    // Combine and group errors
    const allErrors = [
      ...edgeFunctionErrors.map((e: any) => ({ ...e, type: 'edge_function' })),
      ...databaseErrors.map((e: any) => ({ ...e, type: 'database' })),
      ...authErrors.map((e: any) => ({ ...e, type: 'auth' })),
    ];

    console.log(`Found ${allErrors.length} total errors`);

    const groupedErrors = groupErrorsBySignature(allErrors);
    console.log(`Grouped into ${groupedErrors.length} unique error groups`);

    let criticalCount = 0;
    let warningCount = 0;

    // Analyze each group with AI and save
    for (const group of groupedErrors) {
      const severity = determineSeverity(group);
      if (severity === 'critical' || severity === 'high') criticalCount++;
      if (severity === 'medium') warningCount++;

      let aiAnalysis = '';
      let suggestedFix = '';
      let fixConfidence = 0.5;

      // Use Lovable AI for analysis if available
      if (lovableApiKey && group.samples.length > 0) {
        try {
          const aiResult = await analyzeErrorWithAI(lovableApiKey, group);
          aiAnalysis = aiResult.analysis;
          suggestedFix = aiResult.fix;
          fixConfidence = aiResult.confidence;
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
          aiAnalysis = 'AI analysis unavailable';
          suggestedFix = 'Manual investigation required';
        }
      }

      await supabase.from('ai_error_groups').insert({
        report_id: reportId,
        error_type: group.type,
        error_signature: group.signature,
        error_message: group.message,
        first_seen: group.firstSeen,
        last_seen: group.lastSeen,
        occurrence_count: group.count,
        severity,
        ai_analysis: aiAnalysis,
        suggested_fix: suggestedFix,
        fix_confidence: fixConfidence,
        affected_functions: group.affectedFunctions,
        affected_tables: group.affectedTables,
        stack_trace: group.stackTrace,
        sample_log_entries: group.samples,
      });
    }

    // Update report as completed
    await supabase
      .from('ai_error_log_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_errors_found: allErrors.length,
        critical_errors: criticalCount,
        warnings: warningCount,
        grouped_errors_count: groupedErrors.length,
      })
      .eq('id', reportId);

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        summary: {
          totalErrors: allErrors.length,
          groupedErrors: groupedErrors.length,
          criticalErrors: criticalCount,
          warnings: warningCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-error-log-analyzer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchEdgeFunctionErrors(supabase: any, timeThreshold: string) {
  const { data, error } = await supabase.rpc('get_edge_function_errors', {
    time_threshold: timeThreshold
  }).catch(() => ({ data: [], error: null }));
  
  return data || [];
}

async function fetchDatabaseErrors(supabase: any, timeThreshold: string) {
  const { data, error } = await supabase.rpc('get_database_errors', {
    time_threshold: timeThreshold
  }).catch(() => ({ data: [], error: null }));
  
  return data || [];
}

async function fetchAuthErrors(supabase: any, timeThreshold: string) {
  const { data, error } = await supabase.rpc('get_auth_errors', {
    time_threshold: timeThreshold
  }).catch(() => ({ data: [], error: null }));
  
  return data || [];
}

function groupErrorsBySignature(errors: any[]) {
  const groups = new Map();

  for (const error of errors) {
    const signature = generateErrorSignature(error);
    
    if (!groups.has(signature)) {
      groups.set(signature, {
        type: error.type,
        signature,
        message: cleanErrorMessage(error.message || error.error_message || 'Unknown error'),
        firstSeen: error.timestamp || error.created_at,
        lastSeen: error.timestamp || error.created_at,
        count: 0,
        samples: [],
        affectedFunctions: new Set(),
        affectedTables: new Set(),
        stackTrace: error.stack_trace || null,
      });
    }

    const group = groups.get(signature);
    group.count++;
    group.lastSeen = error.timestamp || error.created_at;
    
    if (group.samples.length < 5) {
      group.samples.push({
        timestamp: error.timestamp || error.created_at,
        message: error.message || error.error_message,
        details: error.details || null,
      });
    }

    if (error.function_name) group.affectedFunctions.add(error.function_name);
    if (error.table_name) group.affectedTables.add(error.table_name);
  }

  return Array.from(groups.values()).map(g => ({
    ...g,
    affectedFunctions: Array.from(g.affectedFunctions),
    affectedTables: Array.from(g.affectedTables),
  }));
}

function generateErrorSignature(error: any): string {
  const message = error.message || error.error_message || '';
  const type = error.type || 'unknown';
  const functionName = error.function_name || '';
  
  // Create a signature based on error pattern
  const cleaned = message
    .replace(/\d+/g, 'N') // Replace numbers
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
    .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
    .substring(0, 200);
  
  return `${type}:${functionName}:${cleaned}`;
}

function cleanErrorMessage(message: string): string {
  return message
    .replace(/\s+/g, ' ')
    .substring(0, 500)
    .trim();
}

function determineSeverity(group: any): string {
  const { count, type, message } = group;
  
  // Critical errors
  if (
    count > 100 ||
    message.toLowerCase().includes('out of memory') ||
    message.toLowerCase().includes('database connection') ||
    message.toLowerCase().includes('authentication failed') ||
    type === 'database'
  ) {
    return 'critical';
  }
  
  // High severity
  if (
    count > 50 ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('500') ||
    message.toLowerCase().includes('internal server')
  ) {
    return 'high';
  }
  
  // Medium severity
  if (count > 10 || message.toLowerCase().includes('429') || message.toLowerCase().includes('rate limit')) {
    return 'medium';
  }
  
  return 'low';
}

async function analyzeErrorWithAI(apiKey: string, group: any) {
  const prompt = `Analyze this production error and provide actionable fix suggestions:

Error Type: ${group.type}
Error Message: ${group.message}
Occurrences: ${group.count}
First Seen: ${group.firstSeen}
Last Seen: ${group.lastSeen}
Affected Functions: ${group.affectedFunctions.join(', ') || 'N/A'}
Affected Tables: ${group.affectedTables.join(', ') || 'N/A'}

Sample Logs:
${JSON.stringify(group.samples, null, 2)}

Provide:
1. Root cause analysis (2-3 sentences)
2. Specific fix suggestion with code if applicable
3. Confidence level (0.0-1.0)`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are an expert debugging assistant for production systems. Provide clear, actionable fixes.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse response
  const confidenceMatch = content.match(/confidence.*?(\d\.\d+)/i);
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;

  return {
    analysis: content,
    fix: content.substring(0, 1000), // Truncate for storage
    confidence: Math.min(1.0, Math.max(0.0, confidence)),
  };
}
