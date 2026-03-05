import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaleLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  project_type: string;
  location: string;
  estimated_budget: string;
  hours_in_stage: number;
  timeout_hours: number;
  warning_hours: number;
  stage_name: string;
  last_change: string;
}

interface EstimatorNotification {
  estimatorEmail: string;
  estimatorName: string;
  staleLeads: StaleLead[];
  warningLeads: StaleLead[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Starting stale leads check...");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all leads with their latest stage change timestamp
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select(`
        id,
        name,
        email,
        phone,
        status,
        project_type,
        location,
        estimated_budget,
        created_at
      `);

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      throw leadsError;
    }

    console.log(`Found ${leads?.length || 0} total leads`);

    // Get stage timeout configurations
    const { data: timeouts, error: timeoutsError } = await supabase
      .from("lead_stage_timeouts")
      .select("*")
      .eq("notification_enabled", true);

    if (timeoutsError) {
      console.error("Error fetching timeouts:", timeoutsError);
      throw timeoutsError;
    }

    console.log(`Loaded ${timeouts?.length || 0} timeout configurations`);

    // Get latest stage change for each lead
    const staleLeads: StaleLead[] = [];
    const warningLeads: StaleLead[] = [];

    for (const lead of leads || []) {
      const timeout = timeouts?.find((t) => t.stage_status === lead.status);
      if (!timeout) continue;

      // Get the most recent stage change for this lead
      const { data: stageHistory } = await supabase
        .from("lead_stage_history")
        .select("changed_at")
        .eq("lead_id", lead.id)
        .eq("to_status", lead.status)
        .order("changed_at", { ascending: false })
        .limit(1)
        .single();

      // Use stage change time or lead creation time
      const lastChange = stageHistory?.changed_at || lead.created_at;
      const hoursInStage = (Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60);

      const leadData: StaleLead = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        project_type: lead.project_type,
        location: lead.location,
        estimated_budget: lead.estimated_budget || "TBD",
        hours_in_stage: Math.floor(hoursInStage),
        timeout_hours: timeout.timeout_hours,
        warning_hours: timeout.warning_hours,
        stage_name: formatStageName(lead.status),
        last_change: new Date(lastChange).toLocaleString(),
      };

      if (hoursInStage >= timeout.timeout_hours) {
        staleLeads.push(leadData);
      } else if (hoursInStage >= timeout.warning_hours) {
        warningLeads.push(leadData);
      }
    }

    console.log(`Found ${staleLeads.length} stale leads and ${warningLeads.length} warning leads`);

    if (staleLeads.length === 0 && warningLeads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No stale leads found",
          checked: leads?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get all estimators and admins to notify
    const { data: estimators } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!inner(full_name)
      `)
      .in("role", ["estimator", "admin"]);

    const notifications: EstimatorNotification[] = [];

    for (const estimator of estimators || []) {
      const { data: userData } = await supabase.auth.admin.getUserById(estimator.user_id);
      
      if (userData?.user?.email) {
        notifications.push({
          estimatorEmail: userData.user.email,
          estimatorName: estimator.profiles?.full_name || "Team Member",
          staleLeads,
          warningLeads,
        });
      }
    }

    console.log(`Sending notifications to ${notifications.length} estimators`);

    // Send notifications via Resend
    const emailResults = [];
    
    if (resendApiKey && notifications.length > 0) {
      for (const notification of notifications) {
        try {
          const emailHtml = generateEmailHtml(notification);
          
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "SmartReno <notifications@resend.dev>",
              to: [notification.estimatorEmail],
              subject: `🚨 Lead Alert: ${staleLeads.length} Overdue, ${warningLeads.length} Approaching Deadline`,
              html: emailHtml,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            emailResults.push({ email: notification.estimatorEmail, success: true, result });
            console.log(`Email sent to ${notification.estimatorEmail}`);
          } else {
            emailResults.push({ email: notification.estimatorEmail, success: false, error: result });
            console.error(`Failed to send email to ${notification.estimatorEmail}:`, result);
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${notification.estimatorEmail}:`, emailError);
          emailResults.push({ email: notification.estimatorEmail, success: false, error: emailError });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        staleLeadsCount: staleLeads.length,
        warningLeadsCount: warningLeads.length,
        notificationsSent: emailResults.filter(r => r.success).length,
        totalChecked: leads?.length || 0,
        results: emailResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in check-stale-leads function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

function formatStageName(status: string): string {
  const stageNames: Record<string, string> = {
    new_lead: "New Lead",
    call_24h: "24hr Call",
    walkthrough: "Walkthrough",
    scope_sent: "Scope Sent",
    scope_adjustment: "Scope Adjustment",
    architectural_design: "Architectural/Design",
    bid_room: "Bid Room",
    smart_bid_3: "3SmartBid",
    bid_accepted: "Bid Accepted",
  };
  return stageNames[status] || status;
}

function generateEmailHtml(notification: EstimatorNotification): string {
  const { estimatorName, staleLeads, warningLeads } = notification;

  let leadsHtml = "";

  if (staleLeads.length > 0) {
    leadsHtml += `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-bottom: 15px;">🚨 Overdue Leads (${staleLeads.length})</h2>
        ${staleLeads.map(lead => `
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 10px; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${lead.name}</h3>
            <p style="margin: 5px 0;"><strong>Stage:</strong> ${lead.stage_name}</p>
            <p style="margin: 5px 0;"><strong>Time in Stage:</strong> ${lead.hours_in_stage} hours (Limit: ${lead.timeout_hours}h)</p>
            <p style="margin: 5px 0;"><strong>Project Type:</strong> ${lead.project_type}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${lead.location}</p>
            <p style="margin: 5px 0;"><strong>Budget:</strong> ${lead.estimated_budget}</p>
            <p style="margin: 5px 0;"><strong>Contact:</strong> ${lead.email} | ${lead.phone}</p>
            <p style="margin: 5px 0; color: #dc2626;"><strong>⚠️ Action Required: This lead is ${lead.hours_in_stage - lead.timeout_hours} hours overdue!</strong></p>
          </div>
        `).join("")}
      </div>
    `;
  }

  if (warningLeads.length > 0) {
    leadsHtml += `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #f59e0b; margin-bottom: 15px;">⚠️ Approaching Deadline (${warningLeads.length})</h2>
        ${warningLeads.map(lead => {
          const hoursRemaining = lead.timeout_hours - lead.hours_in_stage;
          return `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 10px; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${lead.name}</h3>
              <p style="margin: 5px 0;"><strong>Stage:</strong> ${lead.stage_name}</p>
              <p style="margin: 5px 0;"><strong>Time in Stage:</strong> ${lead.hours_in_stage} hours</p>
              <p style="margin: 5px 0;"><strong>Project Type:</strong> ${lead.project_type}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${lead.location}</p>
              <p style="margin: 5px 0;"><strong>Budget:</strong> ${lead.estimated_budget}</p>
              <p style="margin: 5px 0;"><strong>Contact:</strong> ${lead.email} | ${lead.phone}</p>
              <p style="margin: 5px 0; color: #f59e0b;"><strong>⏰ ${hoursRemaining} hours remaining before deadline</strong></p>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Lead Stage Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Stale Lead Notification System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${estimatorName},</p>
          
          <p style="margin-bottom: 25px;">
            This automated alert has detected leads that require immediate attention in your sales pipeline.
          </p>

          ${leadsHtml}

          <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>💡 Tip:</strong> Review these leads in your dashboard and take action to move them to the next stage or update their status.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from SmartReno's lead management system.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
