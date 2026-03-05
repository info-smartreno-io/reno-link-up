import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BidComparisonRequest {
  homeownerId: string;
  homeownerEmail: string;
  homeownerName: string;
  estimatorName: string;
  projectName: string;
  reportId: string;
  recommendation?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      homeownerId, 
      homeownerEmail, 
      homeownerName,
      estimatorName,
      projectName,
      reportId,
      recommendation
    }: BidComparisonRequest = await req.json();

    const portalLink = `${supabaseUrl.replace('.supabase.co', '')}/homeowner-portal?tab=bids&report=${reportId}`;

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: homeownerId,
        title: 'New Bid Comparison Available',
        message: `${estimatorName} has sent you a bid comparison for ${projectName}. Please review and select your preferred contractor.`,
        type: 'bid_comparison',
        link: `/homeowner-portal?tab=bids&report=${reportId}`
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Bid Comparison Ready for Review</h1>
        <p>Hello ${homeownerName},</p>
        <p>${estimatorName} has completed the bid analysis for your <strong>${projectName}</strong> project.</p>
        
        ${recommendation ? `
          <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Estimator's Recommendation:</h3>
            <p style="margin-bottom: 0;">${recommendation}</p>
          </div>
        ` : ''}
        
        <p>We've analyzed multiple contractors and prepared a detailed comparison to help you make an informed decision.</p>
        
        <div style="margin: 30px 0;">
          <a href="${portalLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Bid Comparison
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from SmartReno. Please review the comparison and select your preferred contractor when ready.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SmartReno <notifications@smartreno.io>",
      to: [homeownerEmail],
      subject: `Bid Comparison Ready: ${projectName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-bid-comparison function:", error);
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
