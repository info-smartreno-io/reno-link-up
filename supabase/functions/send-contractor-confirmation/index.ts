import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  companyName: string;
  contactName: string;
  trackingNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, contactName, trackingNumber }: EmailRequest = await req.json();

    console.log("Sending contractor confirmation email to:", email);

    // Get current date formatted
    const submittedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Simple HTML email template
    const html = `
      <h2>Thank you for applying, ${contactName}!</h2>
      <p>We have received your contractor application for <strong>${companyName}</strong>.</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Submitted:</strong> ${submittedDate}</p>
      <p>We will review your application and get back to you within 3-5 business days.</p>
      <p>Thank you for your interest in joining the SmartReno contractor network!</p>
      <p>Best regards,<br>The SmartReno Team</p>
    `;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "SmartReno <hello@smartreno.io>",
      to: [email],
      subject: `Application Received - Tracking #${trackingNumber}`,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contractor-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send confirmation email",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
