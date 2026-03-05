import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const { timeRangeHours = 24 } = await req.json();

    console.log(`Analyzing errors from last ${timeRangeHours} hours...`);

    // Create error report
    const { data: report, error: reportError } = await supabase
      .from('ai_error_log_reports')
      .insert({
        status: 'running',
        time_range_hours: timeRangeHours,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Simulate error log entries (in production, fetch from actual logs)
    const simulatedErrors = [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        level: 'error',
        message: 'Failed to fetch contractor data',
        function_name: 'contractor-scoring',
        error_type: 'DatabaseError',
        stack_trace: 'Error at line 45...',
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        level: 'error',
        message: 'Supabase client timeout',
        function_name: 'ai-seo-content-generator',
        error_type: 'TimeoutError',
        stack_trace: 'Error at line 123...',
      },
      {
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        level: 'warning',
        message: 'Slow query detected',
        function_name: 'bulk-import-contractors',
        error_type: 'PerformanceWarning',
        stack_trace: null,
      },
    ];

    // Group errors by signature
    const errorGroups = new Map();

    for (const error of simulatedErrors) {
      const signature = `${error.error_type}:${error.message}:${error.function_name}`;
      
      if (!errorGroups.has(signature)) {
        errorGroups.set(signature, {
          errors: [],
          first_seen: error.timestamp,
          last_seen: error.timestamp,
        });
      }

      const group = errorGroups.get(signature);
      group.errors.push(error);
      group.last_seen = error.timestamp;
    }

    let criticalErrors = 0;
    let warnings = 0;

    // Process each error group with AI
    for (const [signature, group] of errorGroups.entries()) {
      const firstError = group.errors[0];
      
      let aiAnalysis = '';
      let suggestedFix = '';
      let fixConfidence = 0;

      if (lovableApiKey) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: `Analyze this error from SmartReno.io edge functions:

Error Type: ${firstError.error_type}
Message: ${firstError.message}
Function: ${firstError.function_name}
Occurrences: ${group.errors.length}
Stack: ${firstError.stack_trace || 'N/A'}

Provide:
1. Root cause analysis (2-3 sentences)
2. Suggested fix (specific steps)
3. Confidence in fix (0-1)

Format as JSON:
{
  "analysis": "text",
  "fix": "specific steps to fix",
  "confidence": 0.95
}`
              }],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              aiAnalysis = parsed.analysis;
              suggestedFix = parsed.fix;
              fixConfidence = parsed.confidence;
            }
          }
        } catch (err) {
          console.error('AI error analysis failed:', err);
        }
      }

      // Determine severity
      const severity = firstError.level === 'error' ? 
        (group.errors.length > 5 ? 'critical' : 'error') : 
        'warning';

      if (severity === 'critical') criticalErrors++;
      if (severity === 'warning') warnings++;

      // Extract affected resources
      const affectedFunctions = [...new Set(group.errors.map((e: any) => e.function_name))];

      // Insert error group
      await supabase
        .from('ai_error_groups')
        .insert({
          report_id: report.id,
          error_signature: signature,
          error_type: firstError.error_type,
          error_message: firstError.message,
          first_seen: group.first_seen,
          last_seen: group.last_seen,
          occurrence_count: group.errors.length,
          severity: severity,
          affected_functions: affectedFunctions,
          stack_trace: firstError.stack_trace,
          sample_log_entries: group.errors.slice(0, 5),
          ai_analysis: aiAnalysis || 'Error requires investigation',
          suggested_fix: suggestedFix || 'Manual investigation needed',
          fix_confidence: fixConfidence,
          status: 'open',
        });
    }

    // Update report
    await supabase
      .from('ai_error_log_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_errors_found: simulatedErrors.length,
        grouped_errors_count: errorGroups.size,
        critical_errors: criticalErrors,
        warnings: warnings,
      })
      .eq('id', report.id);

    console.log(`Error analysis completed: ${simulatedErrors.length} errors, ${errorGroups.size} groups`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        total_errors: simulatedErrors.length,
        error_groups: errorGroups.size,
        critical: criticalErrors,
        warnings: warnings,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
