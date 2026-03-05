import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WinbackEmailRequest {
  campaignId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  projectType: string;
  emailSubject: string;
  emailTemplate: string;
  offerDetails?: string;
  discountPercentage?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      campaignId,
      leadId,
      leadName,
      leadEmail,
      projectType,
      emailSubject,
      emailTemplate,
      offerDetails,
      discountPercentage,
    }: WinbackEmailRequest = await req.json();

    console.log("Sending win-back email to:", leadEmail);

    // Replace template variables
    let personalizedTemplate = emailTemplate
      .replace(/\{leadName\}/g, leadName)
      .replace(/\{projectType\}/g, projectType)
      .replace(/\{offerDetails\}/g, offerDetails || "")
      .replace(/\{discountPercentage\}/g, discountPercentage?.toString() || "");

    // Send email via Resend API
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .offer-box {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .cta-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>We'd Love to Work With You!</h1>
          </div>
          <div class="content">
            ${personalizedTemplate}
            ${
              offerDetails
                ? `
            <div class="offer-box">
              <h3>🎉 Special Offer Just for You!</h3>
              <p>${offerDetails}</p>
              ${discountPercentage ? `<p><strong>${discountPercentage}% OFF</strong> your project</p>` : ""}
            </div>
            `
                : ""
            }
            <center>
              <a href="mailto:info@smartreno.com?subject=Re: ${encodeURIComponent(projectType)} Project" class="cta-button">
                Get Back in Touch
              </a>
            </center>
            <div class="footer">
              <p>SmartReno - Your Trusted Home Renovation Partner</p>
              <p>If you'd prefer not to receive these emails, please let us know.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SmartReno <hello@smartreno.io>",
        to: [leadEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${await emailResponse.text()}`);
    }

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    // Record the send in database
    const { error: insertError } = await supabase
      .from("winback_campaign_sends")
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
        sent_at: new Date().toISOString(),
        response_type: "no_response",
      });

    if (insertError) {
      console.error("Error recording campaign send:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
        message: "Win-back email sent successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-winback-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
