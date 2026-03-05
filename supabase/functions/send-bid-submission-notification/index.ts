import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BidSubmissionNotification {
  bidSubmissionId: string;
  bidOpportunityId: string;
  bidderName: string;
  bidderType: string;
  bidAmount: number;
  opportunityTitle: string;
  estimatedTimeline: string | null;
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
      bidSubmissionId,
      bidOpportunityId,
      bidderName,
      bidderType,
      bidAmount,
      opportunityTitle,
      estimatedTimeline,
    }: BidSubmissionNotification = await req.json();

    console.log("Sending bid submission notification:", {
      bidSubmissionId,
      opportunityTitle,
      bidderName,
    });

    // Get the bid opportunity to find who created it (estimator)
    const { data: opportunity, error: oppError } = await supabase
      .from('bid_opportunities')
      .select('created_by')
      .eq('id', bidOpportunityId)
      .single();

    if (oppError) {
      console.error('Error fetching opportunity:', oppError);
      throw oppError;
    }

    const estimatorId = opportunity.created_by;

    // Get estimator's email and profile
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const estimatorUser = users?.find(u => u.id === estimatorId);
    if (!estimatorUser) {
      console.log('Estimator user not found');
      return new Response(
        JSON.stringify({ success: false, message: 'Estimator not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { data: estimatorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', estimatorId)
      .single();

    const estimatorName = estimatorProfile?.full_name || 'Estimator';

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: estimatorId,
      title: 'New Bid Submitted',
      message: `${bidderName} submitted a bid of $${bidAmount.toLocaleString()} for ${opportunityTitle}`,
      type: 'new_bid_submission',
      link: `/admin/bid-opportunities`
    });

    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">New Bid Received</h1>
        <p>Hello ${estimatorName},</p>
        <p>A new bid has been submitted for one of your projects.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h2 style="margin-top: 0; color: #15803d;">${opportunityTitle}</h2>
          <div style="margin: 16px 0;">
            <p style="margin: 8px 0;"><strong>Bidder:</strong> ${bidderName}</p>
            <p style="margin: 8px 0;"><strong>Type:</strong> ${bidderType.replace('_', ' ')}</p>
            <p style="margin: 8px 0; font-size: 20px; color: #15803d;"><strong>Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
            ${estimatedTimeline ? `<p style="margin: 8px 0;"><strong>Timeline:</strong> ${estimatedTimeline}</p>` : ''}
          </div>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="https://pscsnsgvfjcbldomnstb.supabase.co/admin/bid-opportunities" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Bid Submission
          </a>
        </div>
        
        <p style="margin-top: 30px;">Next steps: Review the bid details and compare with other submissions to prepare your bid comparison report.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This is an automated notification from SmartReno.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SmartReno <notifications@smartreno.io>",
      to: [estimatorUser.email!],
      subject: `New Bid Submitted: ${opportunityTitle} - ${bidderName}`,
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
    console.error("Error in send-bid-submission-notification function:", error);
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
