import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AgentAction {
  id: string;
  action_type: string;
  action_config: Record<string, any>;
  sequence_order: number;
  stop_on_failure: boolean;
}

interface Agent {
  id: string;
  name: string;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  requires_approval: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { 
      trigger_event,
      trigger_source,
      trigger_source_id,
      trigger_data,
      triggered_by
    } = await req.json();

    console.log(`Agent orchestrator triggered: ${trigger_event} for ${trigger_source}/${trigger_source_id}`);

    // Find matching active agents for this trigger
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('trigger_event', trigger_event)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (agentsError) throw agentsError;

    if (!agents || agents.length === 0) {
      console.log(`No active agents found for trigger: ${trigger_event}`);
      return new Response(
        JSON.stringify({ message: 'No matching agents', runs: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runs: any[] = [];

    for (const agent of agents as Agent[]) {
      // Check if trigger conditions match
      if (!matchesConditions(agent.trigger_conditions, trigger_data)) {
        console.log(`Agent ${agent.name} conditions not matched, skipping`);
        continue;
      }

      // Create agent run record
      const { data: run, error: runError } = await supabase
        .from('agent_runs')
        .insert({
          agent_id: agent.id,
          trigger_source,
          trigger_source_id,
          status: agent.requires_approval ? 'pending' : 'running',
          started_at: agent.requires_approval ? null : new Date().toISOString(),
          triggered_by
        })
        .select()
        .single();

      if (runError) {
        console.error(`Failed to create run for agent ${agent.name}:`, runError);
        continue;
      }

      // If requires approval, don't execute yet
      if (agent.requires_approval) {
        console.log(`Agent ${agent.name} requires approval, run ${run.id} created as pending`);
        runs.push({ agent: agent.name, run_id: run.id, status: 'pending_approval' });
        continue;
      }

      // Get agent actions
      const { data: actions, error: actionsError } = await supabase
        .from('agent_actions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('sequence_order', { ascending: true });

      if (actionsError) {
        console.error(`Failed to fetch actions for agent ${agent.name}:`, actionsError);
        continue;
      }

      // Execute actions
      const result = await executeAgentActions(
        supabase,
        run.id,
        actions as AgentAction[],
        trigger_data,
        trigger_source_id
      );

      // Update run status
      await supabase
        .from('agent_runs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          error_message: result.error,
          result_summary: result.summary
        })
        .eq('id', run.id);

      runs.push({ 
        agent: agent.name, 
        run_id: run.id, 
        status: result.success ? 'completed' : 'failed',
        actions_executed: result.actionsExecuted
      });
    }

    return new Response(
      JSON.stringify({ message: 'Agents processed', runs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Agent orchestrator error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function matchesConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  
  for (const [key, expected] of Object.entries(conditions)) {
    const actual = data[key];
    
    if (Array.isArray(expected)) {
      // Check if actual value is in the expected array
      if (!expected.includes(actual)) return false;
    } else if (expected !== actual) {
      return false;
    }
  }
  
  return true;
}

async function executeAgentActions(
  supabase: any,
  runId: string,
  actions: AgentAction[],
  triggerData: Record<string, any>,
  sourceId: string
): Promise<{ success: boolean; error?: string; summary: any; actionsExecuted: number }> {
  let actionsExecuted = 0;
  const summary: any = { actions: [] };

  for (const action of actions) {
    const startTime = Date.now();
    
    try {
      const result = await executeAction(supabase, action, triggerData, sourceId);
      
      // Log success
      await supabase.from('agent_audit_logs').insert({
        run_id: runId,
        action_id: action.id,
        action_type: action.action_type,
        status: 'success',
        input_data: { config: action.action_config, trigger: triggerData },
        output_data: result,
        duration_ms: Date.now() - startTime
      });

      summary.actions.push({ type: action.action_type, status: 'success', result });
      actionsExecuted++;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Action failed";
      
      // Log failure
      await supabase.from('agent_audit_logs').insert({
        run_id: runId,
        action_id: action.id,
        action_type: action.action_type,
        status: 'failed',
        input_data: { config: action.action_config, trigger: triggerData },
        error_message: errorMessage,
        duration_ms: Date.now() - startTime
      });

      summary.actions.push({ type: action.action_type, status: 'failed', error: errorMessage });

      if (action.stop_on_failure) {
        return { success: false, error: errorMessage, summary, actionsExecuted };
      }
    }
  }

  return { success: true, summary, actionsExecuted };
}

async function executeAction(
  supabase: any,
  action: AgentAction,
  triggerData: Record<string, any>,
  sourceId: string
): Promise<any> {
  const config = action.action_config;

  switch (action.action_type) {
    case 'assign_estimator':
      // Call assign-estimator edge function
      const assignResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/assign-estimator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ leadId: sourceId })
        }
      );
      return await assignResponse.json();

    case 'send_notification':
      return await sendNotification(supabase, config, triggerData, sourceId);

    case 'update_status':
      const { error } = await supabase
        .from(triggerData.source_table || 'leads')
        .update({ status: config.new_status })
        .eq('id', sourceId);
      if (error) throw error;
      return { updated: true, new_status: config.new_status };

    case 'lock_fields':
      // Mark fields as locked in metadata
      const { error: lockError } = await supabase
        .from(triggerData.source_table || 'leads')
        .update({ 
          locked_fields: config.fields,
          fields_locked_at: new Date().toISOString()
        })
        .eq('id', sourceId);
      if (lockError) throw lockError;
      return { locked: config.fields };

    case 'create_task':
      // Create a task record
      const { data: task, error: taskError } = await supabase
        .from('foreman_tasks')
        .insert({
          title: `${config.task_type} for ${sourceId}`,
          description: `Auto-generated task: ${config.task_type}`,
          status: 'pending',
          priority: 'high',
          due_date: new Date(Date.now() + (config.due_days || 3) * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      if (taskError) throw taskError;
      return { task_id: task?.id };

    case 'match_contractors':
      // Placeholder for contractor matching
      console.log(`Would match contractors with criteria:`, config.criteria);
      return { matched: [], criteria: config.criteria };

    case 'send_bid_invitations':
      // Placeholder for bid invitations
      console.log(`Would send bid invitations with deadline: ${config.deadline_days} days`);
      return { invitations_sent: 0, deadline_days: config.deadline_days };

    default:
      console.log(`Unknown action type: ${action.action_type}`);
      return { skipped: true, reason: `Unknown action type: ${action.action_type}` };
  }
}

// Send notifications via appropriate edge functions
async function sendNotification(
  supabase: any,
  config: Record<string, any>,
  triggerData: Record<string, any>,
  sourceId: string
): Promise<any> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const notificationType = config.type || 'email';
  const recipient = config.recipient || 'homeowner';

  console.log(`Sending ${notificationType} notification to ${recipient} for source ${sourceId}`);

  // Get lead/project details for notification content
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*, estimators:estimator_id(id, user_id)')
    .eq('id', sourceId)
    .single();

  if (leadError && leadError.code !== 'PGRST116') {
    console.error('Error fetching lead for notification:', leadError);
  }

  // Handle SMS notifications to estimator
  if (notificationType === 'sms' && recipient === 'estimator' && lead?.estimator_id) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-estimator-assignment-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            estimatorId: lead.estimator_id,
            requestId: sourceId,
            homeownerName: lead?.name || 'Homeowner',
            projectType: lead?.project_type || triggerData.project_type || 'Project',
            address: lead?.location || triggerData.location || 'Address pending'
          })
        }
      );
      
      const result = await response.json();
      console.log('SMS notification result:', result);
      return { sent: true, type: 'sms', recipient: 'estimator', result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SMS send failed';
      console.error('SMS notification error:', message);
      return { sent: false, type: 'sms', recipient: 'estimator', error: message };
    }
  }

  // Handle email notifications to homeowner
  if (notificationType === 'email' && recipient === 'homeowner') {
    try {
      // Create a project notification record
      const { data: notification, error: notifError } = await supabase
        .from('project_notifications')
        .insert({
          project_id: triggerData.project_id || null,
          lead_id: sourceId,
          recipient_email: lead?.email || triggerData.email,
          notification_type: config.notification_subtype || 'lead_update',
          title: config.title || 'Update on Your Project Request',
          message: config.message || `Thank you for your interest! Your ${lead?.project_type || 'project'} request has been received and an estimator will contact you shortly.`,
          status: 'pending'
        })
        .select()
        .single();

      if (notifError) {
        console.error('Error creating notification record:', notifError);
        // Still try to send via the edge function
      }

      if (notification) {
        // Call the send-project-notification edge function
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/send-project-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ notificationId: notification.id })
          }
        );

        const result = await response.json();
        console.log('Email notification result:', result);
        return { sent: true, type: 'email', recipient: 'homeowner', notificationId: notification.id, result };
      }
      
      return { sent: false, type: 'email', recipient: 'homeowner', error: 'Failed to create notification record' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Email send failed';
      console.error('Email notification error:', message);
      return { sent: false, type: 'email', recipient: 'homeowner', error: message };
    }
  }

  // Generic notification logging for other types
  console.log(`Notification type ${notificationType} to ${recipient} not fully implemented yet`);
  return { sent: false, type: notificationType, recipient, message: 'Notification type not fully implemented' };
}
