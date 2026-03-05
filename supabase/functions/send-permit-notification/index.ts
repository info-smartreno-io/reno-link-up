import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PermitNotificationRequest {
  permitId: string;
  newStatus: string;
  oldStatus: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { permitId, newStatus, oldStatus }: PermitNotificationRequest = await req.json();

    console.log(`Processing permit notification: ${permitId}, ${oldStatus} → ${newStatus}`);

    // Fetch permit details with project and homeowner info
    const { data: permit, error: permitError } = await supabase
      .from("permits")
      .select(`
        *,
        projects:project_id (
          id,
          client_name,
          client_email,
          address,
          project_type
        )
      `)
      .eq("id", permitId)
      .single();

    if (permitError) {
      console.error("Error fetching permit:", permitError);
      throw new Error(`Failed to fetch permit: ${permitError.message}`);
    }

    if (!permit.projects) {
      console.error("No project found for permit");
      throw new Error("No project associated with this permit");
    }

    const project = Array.isArray(permit.projects) ? permit.projects[0] : permit.projects;
    const homeownerEmail = project.client_email;
    const homeownerName = project.client_name || "Homeowner";

    if (!homeownerEmail) {
      console.log("No homeowner email found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email to send to" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Generate email content based on status
    const emailContent = generateEmailContent(
      newStatus,
      oldStatus,
      homeownerName,
      project,
      permit
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "SmartReno <permits@smartreno.io>",
      to: [homeownerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Permit notification email sent:", emailResponse);

    // Send SMS for urgent updates (approved, revisions_required, or from overdue status)
    const urgentStatuses = ['approved', 'revisions_required'];
    const shouldSendSMS = urgentStatuses.includes(newStatus) || oldStatus === 'overdue';
    
    if (shouldSendSMS && project.homeowner_phone) {
      try {
        const smsResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-permit-sms`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              phoneNumber: project.homeowner_phone,
              permitStatus: newStatus,
              municipality: permit.jurisdiction_municipality,
              permitNumber: permit.permit_number,
              homeownerName: homeownerName,
            }),
          }
        );
        
        if (smsResponse.ok) {
          console.log("SMS notification sent for urgent permit update");
        }
      } catch (smsError) {
        console.error("Failed to send SMS (non-critical):", smsError);
        // Don't fail the whole notification if SMS fails
      }
    }

    // If approved, create calendar event for permit approval milestone
    if (newStatus === "approved" && permit.approved_at) {
      await createCalendarEvent(supabase, permit, project);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-permit-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

function generateEmailContent(
  newStatus: string,
  oldStatus: string,
  homeownerName: string,
  project: any,
  permit: any
) {
  const statusMessages: Record<string, { subject: string; title: string; message: string; color: string }> = {
    pending: {
      subject: "Permit Application Pending Review",
      title: "Permit Under Review",
      message: `Your permit application for ${permit.jurisdiction_municipality}, ${permit.jurisdiction_state} is currently under review. We'll notify you once there's an update.`,
      color: "#f59e0b",
    },
    submitted: {
      subject: "Your Permit Application Has Been Submitted",
      title: "Permit Application Submitted",
      message: `Your permit application for ${project.project_type} at ${project.address} has been successfully submitted to ${permit.jurisdiction_municipality}. We'll keep you updated on the review process.`,
      color: "#3b82f6"
    },
    approved: {
      subject: "🎉 Your Building Permit Has Been Approved!",
      title: "Permit Approved - Ready to Start!",
      message: `Great news! Your building permit for ${project.project_type} at ${project.address} has been approved by ${permit.jurisdiction_municipality}. ${permit.permit_number ? `Permit #: ${permit.permit_number}` : ''} Work can now begin according to the approved plans.`,
      color: "#10b981"
    },
    revisions_required: {
      subject: "Permit Application Requires Revisions",
      title: "Revisions Requested",
      message: `The building department in ${permit.jurisdiction_municipality} has requested revisions to your permit application for ${project.address}. Our team will address these and resubmit shortly.`,
      color: "#f59e0b"
    },
    zoning_pending: {
      subject: "Zoning Review in Progress",
      title: "Zoning Under Review",
      message: `Your project at ${project.address} is currently under zoning review by ${permit.jurisdiction_municipality}. This is a standard step before permit issuance.`,
      color: "#6366f1"
    }
  };

  const content = statusMessages[newStatus] || {
    subject: "Permit Status Update",
    title: "Permit Status Changed",
    message: `Your permit status for ${project.address} has been updated to: ${newStatus}`,
    color: "#6b7280"
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${content.color} 0%, ${content.color}dd 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${content.title}</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${homeownerName},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">${content.message}</p>
          
          <div style="background: white; border-left: 4px solid ${content.color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Project:</strong> ${project.project_type}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Location:</strong> ${project.address}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Municipality:</strong> ${permit.jurisdiction_municipality}</p>
            ${permit.permit_number ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Permit #:</strong> ${permit.permit_number}</p>` : ''}
          </div>
          
          ${newStatus === 'approved' ? `
            <div style="background: #10b98120; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: #065f46; margin: 0 0 10px 0;">🎉 Next Steps</p>
              <p style="font-size: 14px; color: #065f46; margin: 0;">Your project manager will contact you shortly to schedule the project kickoff and confirm the start date.</p>
            </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Questions? Contact your project team or reply to this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              SmartReno - Making Home Renovation Simple<br>
              <a href="https://smartreno.app" style="color: ${content.color}; text-decoration: none;">smartreno.app</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject: content.subject, html };
}

async function createCalendarEvent(supabase: any, permit: any, project: any) {
  try {
    // Create a milestone event for permit approval
    const eventTitle = `✓ Permit Approved - ${project.project_type}`;
    const eventDescription = `Building permit approved for ${project.address}. Permit #: ${permit.permit_number || 'Pending'}`;
    
    // This would integrate with existing calendar system
    // For now, just log it
    console.log("Calendar event created for permit approval:", {
      title: eventTitle,
      description: eventDescription,
      date: permit.approved_at
    });

    // If you have a calendar events table, insert here
    // await supabase.from('calendar_events').insert({...})
    
  } catch (error) {
    console.error("Error creating calendar event:", error);
    // Don't throw - this is optional functionality
  }
}

serve(handler);
