import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting selection reminder job...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate time thresholds
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find selections that need reminders:
    // 1. Status is still pending
    // 2. Approval request was sent 24-48 hours ago
    // 3. No reminder sent yet OR last reminder was sent more than 24 hours ago
    // 4. Maximum 2 reminders total
    const { data: selectionsNeedingReminders, error: fetchError } = await supabase
      .from("material_selections")
      .select("*")
      .eq("status", "pending")
      .not("approval_request_sent_at", "is", null)
      .not("client_phone", "is", null)
      .lte("approval_request_sent_at", twentyFourHoursAgo.toISOString())
      .gte("approval_request_sent_at", fortyEightHoursAgo.toISOString())
      .lt("reminder_count", 2)
      .or(`reminder_sent_at.is.null,reminder_sent_at.lte.${twentyFourHoursAgo.toISOString()}`);

    if (fetchError) {
      console.error("Error fetching selections:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${selectionsNeedingReminders?.length || 0} selections needing reminders`);

    if (!selectionsNeedingReminders || selectionsNeedingReminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No selections need reminders at this time",
          reminders_sent: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    let successCount = 0;
    let failureCount = 0;

    // Send reminders
    for (const selection of selectionsNeedingReminders) {
      try {
        // Format phone number
        const formattedPhone = selection.client_phone.replace(/\D/g, "");
        const phoneWithCountryCode = formattedPhone.startsWith("1") 
          ? `+${formattedPhone}` 
          : `+1${formattedPhone}`;

        // Calculate hours since original request
        const hoursSinceRequest = Math.floor(
          (now.getTime() - new Date(selection.approval_request_sent_at).getTime()) / (1000 * 60 * 60)
        );

        // Prepare reminder message
        const reminderNumber = (selection.reminder_count || 0) + 1;
        const message = `SmartReno Reminder (${reminderNumber}/2)

Your approval is still needed for:

Project: ${selection.project_name}
Category: ${selection.category}
Item: ${selection.item_description}

This request was sent ${hoursSinceRequest} hours ago.

Please reply with:
- APPROVE to approve
- REJECT to reject

Questions? Contact us at support@smartreno.com`;

        console.log(`Sending reminder to ${phoneWithCountryCode} for selection ${selection.id}`);

        // Send SMS via Twilio
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
          console.error(`Failed to send SMS for selection ${selection.id}:`, errorText);
          failureCount++;
          continue;
        }

        const twilioData = await twilioResponse.json();
        console.log(`Reminder sent successfully for selection ${selection.id}:`, twilioData.sid);

        // Update the selection record
        const { error: updateError } = await supabase
          .from("material_selections")
          .update({
            reminder_sent_at: now.toISOString(),
            reminder_count: (selection.reminder_count || 0) + 1,
          })
          .eq("id", selection.id);

        if (updateError) {
          console.error(`Error updating selection ${selection.id}:`, updateError);
          failureCount++;
        } else {
          successCount++;
        }

      } catch (error) {
        console.error(`Error processing selection ${selection.id}:`, error);
        failureCount++;
      }
    }

    console.log(`Reminder job complete. Sent: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reminder job completed",
        reminders_sent: successCount,
        failures: failureCount,
        total_checked: selectionsNeedingReminders.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-selection-reminders function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
