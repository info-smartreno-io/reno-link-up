import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractorSelectionRequest {
  estimatorId: string;
  estimatorEmail: string;
  estimatorName: string;
  homeownerName: string;
  projectName: string;
  contractorName: string;
  bidAmount: number;
  reportId: string;
  homeownerNotes?: string;
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
      estimatorId,
      estimatorEmail,
      estimatorName,
      homeownerName,
      projectName,
      contractorName,
      bidAmount,
      reportId,
      homeownerNotes
    }: ContractorSelectionRequest = await req.json();

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: estimatorId,
        title: 'Contractor Selected',
        message: `${homeownerName} has selected ${contractorName} for ${projectName} ($${bidAmount.toLocaleString()})`,
        type: 'contractor_selection',
        link: `/estimator/bid-review?report=${reportId}`
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Contractor Selection Made</h1>
        <p>Hello ${estimatorName},</p>
        <p><strong>${homeownerName}</strong> has reviewed the bid comparison for <strong>${projectName}</strong> and made their selection.</p>
        
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #15803d;">Selected Contractor:</h3>
          <p style="font-size: 18px; margin: 8px 0;"><strong>${contractorName}</strong></p>
          <p style="margin: 0; color: #166534;">Bid Amount: $${bidAmount.toLocaleString()}</p>
        </div>
        
        ${homeownerNotes ? `
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Homeowner Notes:</h3>
            <p style="margin-bottom: 0; color: #4b5563;">${homeownerNotes}</p>
          </div>
        ` : ''}
        
        <p style="margin-top: 30px;">Next steps: Please coordinate with the selected contractor to finalize the project details and timeline.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This is an automated notification from SmartReno.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SmartReno <notifications@smartreno.io>",
      to: [estimatorEmail],
      subject: `Contractor Selected: ${projectName} - ${contractorName}`,
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
    console.error("Error in send-contractor-selection function:", error);
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
