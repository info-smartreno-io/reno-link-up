import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BidStatusNotification {
  bidSubmissionId: string;
  newStatus: string;
  oldStatus: string;
  bidderEmail: string;
  bidderName: string;
  opportunityTitle: string;
  bidAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      bidSubmissionId,
      newStatus,
      oldStatus,
      bidderEmail,
      bidderName,
      opportunityTitle,
      bidAmount,
    }: BidStatusNotification = await req.json();

    console.log("Sending bid status notification:", {
      bidSubmissionId,
      newStatus,
      oldStatus,
      bidderEmail,
    });

    // Determine email subject and content based on status
    let subject = "";
    let htmlContent = "";

    switch (newStatus) {
      case "accepted":
        subject = `🎉 Your Bid Has Been Accepted - ${opportunityTitle}`;
        htmlContent = `
          <h1 style="color: #10b981;">Congratulations! Your Bid Has Been Accepted</h1>
          <p>Dear ${bidderName},</p>
          <p>We're pleased to inform you that your bid for <strong>${opportunityTitle}</strong> has been accepted!</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Bid Details:</h3>
            <p><strong>Project:</strong> ${opportunityTitle}</p>
            <p><strong>Your Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
            <p><strong>Status:</strong> Accepted</p>
          </div>
          <p>The SmartReno team will be in touch shortly with next steps and contract details.</p>
          <p>Best regards,<br>The SmartReno Team</p>
        `;
        break;

      case "rejected":
        subject = `Bid Status Update - ${opportunityTitle}`;
        htmlContent = `
          <h1 style="color: #6b7280;">Bid Status Update</h1>
          <p>Dear ${bidderName},</p>
          <p>Thank you for submitting your bid for <strong>${opportunityTitle}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Bid Details:</h3>
            <p><strong>Project:</strong> ${opportunityTitle}</p>
            <p><strong>Your Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
            <p><strong>Status:</strong> Not Selected</p>
          </div>
          <p>While your bid was not selected for this project, we encourage you to continue bidding on future opportunities in the SmartReno platform.</p>
          <p>We appreciate your interest and look forward to working with you on upcoming projects.</p>
          <p>Best regards,<br>The SmartReno Team</p>
        `;
        break;

      case "under_review":
        subject = `Your Bid is Under Review - ${opportunityTitle}`;
        htmlContent = `
          <h1 style="color: #3b82f6;">Your Bid is Under Review</h1>
          <p>Dear ${bidderName},</p>
          <p>Your bid for <strong>${opportunityTitle}</strong> is currently under review by our team.</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Bid Details:</h3>
            <p><strong>Project:</strong> ${opportunityTitle}</p>
            <p><strong>Your Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
            <p><strong>Status:</strong> Under Review</p>
          </div>
          <p>We'll notify you once a decision has been made. Thank you for your patience.</p>
          <p>Best regards,<br>The SmartReno Team</p>
        `;
        break;

      default:
        subject = `Bid Status Update - ${opportunityTitle}`;
        htmlContent = `
          <h1>Bid Status Update</h1>
          <p>Dear ${bidderName},</p>
          <p>The status of your bid for <strong>${opportunityTitle}</strong> has been updated.</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Bid Details:</h3>
            <p><strong>Project:</strong> ${opportunityTitle}</p>
            <p><strong>Your Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
            <p><strong>New Status:</strong> ${newStatus}</p>
          </div>
          <p>Best regards,<br>The SmartReno Team</p>
        `;
    }

    const emailResponse = await resend.emails.send({
      from: "SmartReno <notifications@smartreno.io>",
      to: [bidderEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-bid-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
