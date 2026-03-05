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
    const { 
      warrantyId, 
      projectId, 
      description, 
      photos = [], 
      contractorId, 
      projectScope = {}, 
      timeline = [], 
      tradeInvolved 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing warranty claim:', warrantyId);

    // Build AI prompt
    const prompt = `You are an expert warranty claim analyst for a home renovation platform.

Analyze this warranty claim and provide classification:

Description: ${description}
Trade Involved: ${tradeInvolved || 'Unknown'}
Number of Photos: ${photos.length}
Project Scope Summary: ${JSON.stringify(projectScope).substring(0, 500)}

Based on this information, classify the warranty claim:

1. **Category**: Determine which trade/category this falls under (roofing, plumbing, electrical, flooring, structural, finish carpentry, drywall/paint, HVAC, other)

2. **Severity**: 
   - low: Cosmetic issues, no functional impact
   - medium: Functional issues but not urgent, no safety risk
   - high: Risk of damage, safety hazard, or urgent repair needed

3. **Responsible Party**: Who is likely responsible?
   - contractor: General contractor's responsibility
   - subcontractor: Specific trade subcontractor
   - homeowner_misuse: Appears to be user error or misuse
   - material_failure: Product/material defect
   - manufacturer_issue: Manufacturer warranty issue

4. **Recommended Action**:
   - route_to_contractor
   - route_to_subcontractor
   - request_more_photos
   - schedule_inspection
   - escalate_to_admin

5. **Needs More Info**: true/false - Is more information needed?

6. **Message Templates**: Generate professional messages for:
   - Homeowner acknowledgment
   - Contractor/subcontractor notification

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "category": "category_name",
  "severity": "low|medium|high",
  "responsible_party": "contractor|subcontractor|homeowner_misuse|material_failure|manufacturer_issue",
  "recommended_action": "route_to_contractor|route_to_subcontractor|request_more_photos|schedule_inspection|escalate_to_admin",
  "needs_more_info": false,
  "message_homeowner": "Professional message to homeowner",
  "message_contractor": "Professional message to contractor",
  "reasoning": "Brief explanation of your classification"
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let classification;
    try {
      // Try to parse the content as JSON
      classification = JSON.parse(content);
    } catch {
      // If parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Classification result:', classification);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'WarrantyAI',
        user_id: contractorId || '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { warrantyId, description, tradeInvolved },
        output: classification,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(classification),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-warranty-classifier:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
