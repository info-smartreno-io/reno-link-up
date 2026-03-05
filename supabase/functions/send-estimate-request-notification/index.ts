import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EstimateNotificationRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  project_type: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, address, project_type, message }: EstimateNotificationRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a73e8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
            .info-row { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Estimate Request</h1>
            </div>
            <div class="content">
              <p>A new estimate request has been submitted. Please review and assign to an estimator:</p>
              
              <div class="info-row">
                <span class="label">Name:</span> ${name}
              </div>
              <div class="info-row">
                <span class="label">Email:</span> ${email}
              </div>
              <div class="info-row">
                <span class="label">Phone:</span> ${phone}
              </div>
              <div class="info-row">
                <span class="label">Address:</span> ${address}
              </div>
              <div class="info-row">
                <span class="label">Project Type:</span> ${project_type}
              </div>
              <div class="info-row">
                <span class="label">Message:</span><br>
                ${message}
              </div>
              
              <p style="margin-top: 30px;">
                <a href="https://smartreno.io/admin/estimate-requests" 
                   style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  View in Dashboard
                </a>
              </p>
            </div>
            <div class="footer">
              <p>SmartReno Project Management System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "SmartReno <notifications@smartreno.io>",
      to: ["info@smartreno.io"],
      subject: `New Estimate Request: ${name} - ${project_type}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-estimate-request-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
