import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Find invoices that need reminders
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['sent', 'partially_paid'])
      .or(`due_date.lte.${threeDaysFromNow.toISOString().split('T')[0]},due_date.lt.${now.toISOString().split('T')[0]}`)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${sevenDaysAgo.toISOString()}`);

    if (fetchError) {
      console.error('Error fetching invoices:', fetchError);
      throw fetchError;
    }

    if (!invoices || invoices.length === 0) {
      console.log('No invoices need reminders');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No invoices need reminders',
          remindersSent: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    let remindersSent = 0;

    for (const invoice of invoices) {
      try {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = dueDate < now;
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const daysOverdue = isOverdue ? Math.abs(daysUntilDue) : 0;

        let subject = '';
        let urgency = '';

        if (isOverdue) {
          subject = `OVERDUE: Invoice ${invoice.invoice_number} - Payment Required`;
          urgency = `<div style="background-color: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <strong>⚠️ OVERDUE NOTICE</strong><br>
            This invoice is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Please submit payment immediately to avoid late fees.
          </div>`;
        } else {
          subject = `Reminder: Invoice ${invoice.invoice_number} - Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
          urgency = `<div style="background-color: #fef3c7; color: #92400e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <strong>📅 Payment Reminder</strong><br>
            This invoice is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} (${dueDate.toLocaleDateString()}).
          </div>`;
        }

        const balance = invoice.total_amount - invoice.amount_paid;
        const recipientName = invoice.client_name || invoice.homeowner_name || 'Customer';
        const recipientEmail = invoice.client_email || invoice.homeowner_email;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>${subject}</title></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #1a1a1a;">Payment Reminder</h1>
                <p style="margin: 10px 0 0 0; color: #666;">Invoice ${invoice.invoice_number}</p>
              </div>

              ${urgency}

              <div style="margin-bottom: 20px;">
                <p>Dear ${recipientName},</p>
                <p>This is a ${isOverdue ? 'final' : 'friendly'} reminder that invoice ${invoice.invoice_number} ${isOverdue ? 'was' : 'is'} due on ${dueDate.toLocaleDateString()}.</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0;">Invoice Details</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span><strong>Invoice Number:</strong></span>
                  <span>${invoice.invoice_number}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span><strong>Invoice Date:</strong></span>
                  <span>${new Date(invoice.invoice_date).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span><strong>Due Date:</strong></span>
                  <span>${dueDate.toLocaleDateString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-top: 10px; border-top: 2px solid #dee2e6;">
                  <span><strong>Total Amount:</strong></span>
                  <span style="font-size: 1.2em;"><strong>$${invoice.total_amount.toFixed(2)}</strong></span>
                </div>
                ${invoice.amount_paid > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Amount Paid:</strong></span>
                    <span style="color: #16a34a;">$${invoice.amount_paid.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #dee2e6;">
                    <span><strong>Balance Due:</strong></span>
                    <span style="font-size: 1.2em; color: ${isOverdue ? '#dc2626' : '#1a1a1a'};"><strong>$${balance.toFixed(2)}</strong></span>
                  </div>
                ` : ''}
              </div>

              ${invoice.payment_instructions ? `
                <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <h4 style="margin-top: 0;">Payment Instructions</h4>
                  <p style="margin-bottom: 0;">${invoice.payment_instructions}</p>
                </div>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 0.9em;">
                <p>If you have already submitted payment, please disregard this reminder.</p>
                <p>If you have any questions about this invoice, please contact us immediately.</p>
              </div>
            </body>
          </html>
        `;

        // Send reminder email
        const { error: emailError } = await resend.emails.send({
          from: 'SmartReno <invoices@smartreno.io>',
          to: [recipientEmail],
          subject: subject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send reminder for invoice ${invoice.invoice_number}:`, emailError);
          continue;
        }

        // Update invoice with reminder info
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            last_reminder_sent: now.toISOString(),
            reminder_count: (invoice.reminder_count || 0) + 1,
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error(`Failed to update reminder info for invoice ${invoice.invoice_number}:`, updateError);
        }

        remindersSent++;
        console.log(`Reminder sent for invoice ${invoice.invoice_number}`);
      } catch (error) {
        console.error(`Error processing invoice ${invoice.invoice_number}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Payment reminders sent successfully`,
        remindersSent,
        invoicesChecked: invoices.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-invoice-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
