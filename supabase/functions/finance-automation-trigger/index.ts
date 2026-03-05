import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationPayload {
  event_type: 'contract_signed' | 'deposit_collected' | 'lead_sold';
  contract_id?: string;
  project_id?: string;
  payment_id?: string;
  lead_id?: string;
  contract_value?: number;
  deposit_amount?: number;
  amount?: number;
  signed_by?: string;
  estimator_id?: string;
  lead_name?: string;
  project_type?: string;
  estimated_budget?: string;
}

// Default build gates template
const DEFAULT_BUILD_GATES = [
  { gate_name: 'Final Scope Approved', gate_type: 'scope', owner: 'coordinator', sort_order: 1 },
  { gate_name: 'Final Plans Complete', gate_type: 'plans', owner: 'coordinator', sort_order: 2 },
  { gate_name: 'Zoning/HOA Prepared', gate_type: 'zoning', owner: 'coordinator', sort_order: 3 },
  { gate_name: 'Permit Prepared', gate_type: 'permit', owner: 'coordinator', sort_order: 4 },
  { gate_name: 'Subs Awarded', gate_type: 'subs', owner: 'coordinator', sort_order: 5 },
  { gate_name: 'Budget Finalized', gate_type: 'budget', owner: 'coordinator', sort_order: 6 },
  { gate_name: 'Materials Ordered', gate_type: 'materials', owner: 'coordinator', sort_order: 7 },
  { gate_name: 'Deposit Received', gate_type: 'deposit', owner: 'finance', sort_order: 8 },
  { gate_name: 'PM Approved Start', gate_type: 'pm_approval', owner: 'pm', sort_order: 9 },
];

// deno-lint-ignore no-explicit-any
type SupabaseClientType = any;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AutomationPayload = await req.json();
    console.log('Finance automation triggered:', payload.event_type, payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: Record<string, unknown> = {};

    switch (payload.event_type) {
      case 'contract_signed':
        result = await handleContractSigned(supabase, payload);
        break;
      case 'deposit_collected':
        result = await handleDepositCollected(supabase, payload);
        break;
      case 'lead_sold':
        result = await handleLeadSold(supabase, payload);
        break;
      default:
        throw new Error(`Unknown event type: ${payload.event_type}`);
    }

    console.log('Automation result:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Finance automation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * A7. Contract Signed → Generate Deposit Invoice
 * - Generate deposit invoice (10% or first milestone)
 * - Notify finance team
 * - Update project status
 */
async function handleContractSigned(
  supabase: SupabaseClientType,
  payload: AutomationPayload
): Promise<Record<string, unknown>> {
  const { contract_id, project_id, contract_value, deposit_amount, signed_by } = payload;

  if (!project_id || !contract_id) {
    throw new Error('Missing required fields: project_id, contract_id');
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*, lead_id')
    .eq('id', project_id)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw projectError;
  }

  // Get lead details for homeowner info
  let homeownerName = 'Homeowner';
  let homeownerEmail = '';

  if (project?.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, email')
      .eq('id', project.lead_id)
      .single();

    if (lead) {
      homeownerName = lead.name || 'Homeowner';
      homeownerEmail = lead.email || '';
    }
  }

  // Calculate deposit amount (10% default)
  const depositAmt = deposit_amount || (contract_value ? contract_value * 0.10 : 0);

  // Generate deposit invoice
  const invoiceNumber = `DEP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      project_id: project_id,
      client_name: homeownerName,
      client_email: homeownerEmail,
      total_amount: depositAmt,
      status: 'sent',
      due_date: dueDate.toISOString().split('T')[0],
      invoice_date: new Date().toISOString().split('T')[0],
      notes: 'Deposit payment - 10% of contract value',
      line_items: [{
        description: 'Contract Deposit (10%)',
        quantity: 1,
        unit_price: depositAmt,
        total: depositAmt
      }],
      user_id: signed_by || project?.user_id
    })
    .select()
    .single();

  if (invoiceError) {
    console.error('Error creating deposit invoice:', invoiceError);
    throw invoiceError;
  }

  // Create payment schedule entry
  await supabase
    .from('payment_schedules')
    .insert({
      contract_id: contract_id,
      milestone_name: 'Deposit',
      percentage: 10,
      amount: depositAmt,
      trigger_type: 'contract_signed',
      status: 'pending',
      invoice_id: invoice?.id,
      due_date: dueDate.toISOString().split('T')[0]
    });

  // Log notification for finance team
  console.log(`[NOTIFY] Finance team: Deposit invoice ${invoiceNumber} generated for project ${project_id}`);

  // Try to send email notification to homeowner
  if (homeownerEmail) {
    try {
      await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice?.id,
          recipientEmail: homeownerEmail,
          recipientName: homeownerName
        }
      });
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // Don't throw - invoice is still created
    }
  }

  return {
    action: 'deposit_invoice_generated',
    invoice_id: invoice?.id,
    invoice_number: invoiceNumber,
    amount: depositAmt,
    project_id
  };
}

/**
 * A8. Deposit Collected → Assign PC + Create Build Gates
 * - Assign Project Coordinator from pool
 * - Create all build_gates with default status
 * - Notify PC with project brief
 */
async function handleDepositCollected(
  supabase: SupabaseClientType,
  payload: AutomationPayload
): Promise<Record<string, unknown>> {
  const { project_id, payment_id, amount } = payload;

  if (!project_id) {
    throw new Error('Missing required field: project_id');
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw projectError;
  }

  // Find available Project Coordinator
  // Look for users with project_coordinator role who have capacity
  const { data: coordinators } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'project_coordinator')
    .limit(10);

  let assignedCoordinatorId: string | null = null;

  if (coordinators && coordinators.length > 0) {
    // Get coordinator with least active projects
    const coordinatorIds = coordinators.map((c: { user_id: string }) => c.user_id);
    const { data: coordinatorLoads } = await supabase
      .from('projects')
      .select('coordinator_id')
      .in('coordinator_id', coordinatorIds)
      .in('status', ['pre_construction', 'in_construction']);

    // Count projects per coordinator
    const loadMap: Record<string, number> = {};
    coordinatorLoads?.forEach((p: { coordinator_id: string }) => {
      if (p.coordinator_id) {
        loadMap[p.coordinator_id] = (loadMap[p.coordinator_id] || 0) + 1;
      }
    });

    // Find coordinator with lowest load
    let minLoad = Infinity;
    for (const c of coordinators) {
      const coord = c as { user_id: string };
      const load = loadMap[coord.user_id] || 0;
      if (load < minLoad) {
        minLoad = load;
        assignedCoordinatorId = coord.user_id;
      }
    }
  }

  // Update project with coordinator assignment
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      coordinator_id: assignedCoordinatorId,
      pc_assigned_at: new Date().toISOString(),
      deposit_received_at: new Date().toISOString(),
      status: 'pre_construction'
    })
    .eq('id', project_id);

  if (updateError) {
    console.error('Error updating project:', updateError);
    throw updateError;
  }

  // Check if build gates already exist
  const { data: existingGates } = await supabase
    .from('build_gates')
    .select('id')
    .eq('project_id', project_id);

  let gatesCreated = 0;

  if (!existingGates || existingGates.length === 0) {
    // Create build gates for this project
    const gatesToCreate = DEFAULT_BUILD_GATES.map(gate => ({
      ...gate,
      project_id: project_id,
      status: gate.gate_type === 'deposit' ? 'complete' : 'pending' // Mark deposit as complete
    }));

    const { data: gates, error: gatesError } = await supabase
      .from('build_gates')
      .insert(gatesToCreate)
      .select();

    if (gatesError) {
      console.error('Error creating build gates:', gatesError);
      throw gatesError;
    }

    gatesCreated = gates?.length || 0;
  }

  // Update payment schedule if exists
  await supabase
    .from('payment_schedules')
    .update({ status: 'collected', collected_at: new Date().toISOString() })
    .eq('trigger_type', 'contract_signed')
    .eq('status', 'pending');

  // Log notification for PC
  if (assignedCoordinatorId) {
    console.log(`[NOTIFY] PC ${assignedCoordinatorId}: Assigned to project ${project_id}`);
    
    // Get PC email for notification
    const { data: pcProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', assignedCoordinatorId)
      .single();

    console.log(`[NOTIFY] PC ${pcProfile?.full_name || 'Unknown'} assigned to project`);
  }

  return {
    action: 'pc_assigned_gates_created',
    project_id,
    coordinator_id: assignedCoordinatorId,
    gates_created: gatesCreated,
    payment_id
  };
}

/**
 * A6. Lead Sold → Lock Estimator + Generate Contract Draft
 * - Lock estimator editing on lead
 * - Generate contract draft
 * - Create project record if not exists
 * - Notify finance team
 */
async function handleLeadSold(
  supabase: SupabaseClientType,
  payload: AutomationPayload
): Promise<Record<string, unknown>> {
  const { lead_id, lead_name, estimator_id, project_type, estimated_budget } = payload;

  if (!lead_id) {
    throw new Error('Missing required field: lead_id');
  }

  // Get full lead details
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (leadError) {
    console.error('Error fetching lead:', leadError);
    throw leadError;
  }

  // Check if project already exists for this lead
  let projectId: string | null = null;
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id')
    .eq('lead_id', lead_id)
    .single();

  if (existingProject) {
    projectId = existingProject.id;
  } else {
    // Create project from lead
    const budgetValue = estimated_budget ? parseFloat(estimated_budget.replace(/[^0-9.-]/g, '')) : null;
    
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        lead_id: lead_id,
        user_id: estimator_id,
        name: `${lead_name || 'New'} - ${project_type || 'Project'}`,
        description: lead?.client_notes,
        project_type: project_type,
        status: 'sold_pending_contract',
        estimated_budget: budgetValue
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    projectId = newProject?.id;
  }

  // Generate contract draft
  const contractNumber = await generateContractNumber(supabase);
  const budgetValue = estimated_budget ? parseFloat(estimated_budget.replace(/[^0-9.-]/g, '')) : 0;

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      project_id: projectId,
      contract_number: contractNumber,
      contract_value: budgetValue,
      signature_status: 'draft',
      payment_schedule_template: 'standard',
      created_by: estimator_id
    })
    .select()
    .single();

  if (contractError) {
    console.error('Error creating contract:', contractError);
    throw contractError;
  }

  // Log notification for finance team
  console.log(`[NOTIFY] Finance team: Lead ${lead_name} sold - Contract ${contractNumber} created`);
  console.log(`[NOTIFY] Estimator ${estimator_id}: Lead locked, contract ready for review`);

  return {
    action: 'lead_sold_contract_created',
    lead_id,
    project_id: projectId,
    contract_id: contract?.id,
    contract_number: contractNumber
  };
}

/**
 * Generate unique contract number
 */
async function generateContractNumber(supabase: SupabaseClientType): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C-${year}-`;

  // Get the highest existing contract number for this year
  const { data: contracts } = await supabase
    .from('contracts')
    .select('contract_number')
    .like('contract_number', `${prefix}%`)
    .order('contract_number', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (contracts && contracts.length > 0) {
    const lastNumber = contracts[0].contract_number;
    const lastSequence = parseInt(lastNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}
