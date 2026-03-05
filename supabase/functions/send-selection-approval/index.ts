import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendApprovalRequest {
  selectionId: string;
  clientPhone: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectionId, clientPhone }: SendApprovalRequest = await req.json();

    console.log("Processing approval request for selection:", selectionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the auth token from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch the selection details
    const { data: selection, error: selectionError } = await supabase
      .from("material_selections")
      .select("*")
      .eq("id", selectionId)
      .single();

    if (selectionError || !selection) {
      throw new Error("Selection not found");
    }

    // Generate approval link (could be a unique link to a public approval page)
    const approvalLink = `${Deno.env.get("SUPABASE_URL")}/approve/${selectionId}`;

    // Format phone number (remove any non-numeric characters)
    const formattedPhone = clientPhone.replace(/\D/g, "");
    const phoneWithCountryCode = formattedPhone.startsWith("1") 
      ? `+${formattedPhone}` 
      : `+1${formattedPhone}`;

    // Prepare SMS message
    const message = `SmartReno Material Selection Approval Request

Project: ${selection.project_name}
Category: ${selection.category}
Item: ${selection.item_description}

Please review and approve/reject this selection.
Reply with:
- APPROVE to approve
- REJECT to reject

Questions? Contact us at support@smartreno.com`;

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneWithCountryCode,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error("Twilio error:", errorText);
      throw new Error(`Failed to send SMS: ${errorText}`);
    }

    const twilioData = await twilioResponse.json();
    console.log("SMS sent successfully:", twilioData.sid);

    // Update the selection record
    const { error: updateError } = await supabase
      .from("material_selections")
      .update({
        client_phone: clientPhone,
        approval_request_sent_at: new Date().toISOString(),
        approval_request_sent_by: user.id,
        approval_link: approvalLink,
      })
      .eq("id", selectionId);

    if (updateError) {
      console.error("Error updating selection:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval request sent successfully",
        messageSid: twilioData.sid,
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
    console.error("Error in send-selection-approval function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
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
});
