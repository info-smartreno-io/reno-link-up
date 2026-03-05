import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for overdue permits...");

    // Find permits that are overdue (estimated_approval_date has passed and status is not approved/closed)
    const { data: overduePermits, error: permitError } = await supabase
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
      .in("status", ["pending", "submitted", "zoning_pending", "ucc_pending", "revisions_required"])
      .not("estimated_approval_date", "is", null)
      .lt("estimated_approval_date", new Date().toISOString())
      .or("last_notification_sent_at.is.null,last_notification_sent_at.lt." + 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Only notify if last notification was >24h ago

    if (permitError) {
      console.error("Error fetching overdue permits:", permitError);
      throw new Error(`Failed to fetch overdue permits: ${permitError.message}`);
    }

    console.log(`Found ${overduePermits?.length || 0} overdue permits`);

    const results = [];

    for (const permit of overduePermits || []) {
      if (!permit.projects) continue;

      const project = Array.isArray(permit.projects) ? permit.projects[0] : permit.projects;
      const homeownerEmail = project.client_email;
      const homeownerName = project.client_name || "Homeowner";

      if (!homeownerEmail) {
        console.log(`No email for permit ${permit.id}, skipping`);
        continue;
      }

      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(permit.estimated_approval_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
              .label { font-weight: 600; color: #6b7280; font-size: 14px; }
              .value { color: #111827; font-size: 16px; margin-top: 4px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Permit Review Overdue</h1>
              </div>
              <div class="content">
                <p>Dear ${homeownerName},</p>
                
                <div class="alert-box">
                  <strong>Attention Required:</strong> Your permit application is now <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong> for approval.
                </div>

                <p>We're actively monitoring your permit status and will follow up with the municipality on your behalf.</p>

                <div class="detail-row">
                  <div class="label">Permit Status</div>
                  <div class="value">${permit.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                </div>

                <div class="detail-row">
                  <div class="label">Municipality</div>
                  <div class="value">${permit.jurisdiction_municipality}, ${permit.jurisdiction_state}</div>
                </div>

                <div class="detail-row">
                  <div class="label">Project Address</div>
                  <div class="value">${project.address}</div>
                </div>

                <div class="detail-row">
                  <div class="label">Expected Approval Date</div>
                  <div class="value">${new Date(permit.estimated_approval_date).toLocaleDateString()}</div>
                </div>

                <div class="detail-row">
                  <div class="label">Days Overdue</div>
                  <div class="value" style="color: #ef4444; font-weight: 600;">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</div>
                </div>

                ${permit.permit_number ? `
                <div class="detail-row">
                  <div class="label">Permit Number</div>
                  <div class="value">${permit.permit_number}</div>
                </div>
                ` : ''}

                <p style="margin-top: 30px;">
                  <strong>Next Steps:</strong>
                </p>
                <ul>
                  <li>Our team is contacting the municipality to request a status update</li>
                  <li>We'll notify you immediately when we receive any updates</li>
                  <li>You can contact us anytime if you have questions</li>
                </ul>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Permit processing times can vary. Some municipalities experience delays during high-volume periods. Rest assured, we're monitoring this closely.
                </p>
              </div>
              <div class="footer">
                <p>SmartReno Permit Management</p>
                <p style="font-size: 12px; color: #9ca3af;">This is an automated notification. Do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "SmartReno Permits <permits@smartreno.app>",
          to: [homeownerEmail],
          subject: `⚠️ Permit Review Overdue - ${permit.jurisdiction_municipality}`,
          html: emailHtml,
        });

        console.log(`Overdue notification sent for permit ${permit.id}:`, emailResponse);

        // Send SMS for overdue permits
        if (project.homeowner_phone) {
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
                  permitStatus: permit.status,
                  municipality: permit.jurisdiction_municipality,
                  permitNumber: permit.permit_number,
                  homeownerName: homeownerName,
                  isOverdue: true,
                  daysOverdue: daysOverdue,
                }),
              }
            );
            
            if (smsResponse.ok) {
              console.log(`SMS sent for overdue permit ${permit.id}`);
            }
          } catch (smsError) {
            console.error(`Failed to send SMS for permit ${permit.id}:`, smsError);
          }
        }

        // Update last notification timestamp
        await supabase
          .from("permits")
          .update({ 
            last_notification_sent_at: new Date().toISOString(),
            notification_count: (permit.notification_count || 0) + 1
          })
          .eq("id", permit.id);

        results.push({ permitId: permit.id, success: true, emailResponse });
      } catch (emailError: any) {
        console.error(`Failed to send overdue notification for permit ${permit.id}:`, emailError);
        results.push({ permitId: permit.id, success: false, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: overduePermits?.length || 0,
        notificationsSent: results.filter(r => r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in check-overdue-permits:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
