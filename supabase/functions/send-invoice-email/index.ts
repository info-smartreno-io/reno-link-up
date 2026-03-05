import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  invoiceId: string;
  companyName: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, companyName, companyEmail, companyAddress, companyPhone }: InvoiceRequest = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    // Get recipient info (support both old and new column names)
    const recipientName = invoice.client_name || invoice.homeowner_name || 'Customer';
    const recipientEmail = invoice.client_email || invoice.homeowner_email;
    
    // Generate simple PDF content (text-based for Deno)
    const pdfContent = generateInvoicePDF(invoice, companyName, companyEmail, companyAddress, companyPhone, recipientName);

    // Generate email HTML
    const lineItemsHtml = (invoice.line_items || []).map((item: any) => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.amount).toFixed(2)}</td>
      </tr>`
    ).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #1a1a1a;">Invoice ${invoice.invoice_number}</h1>
            <p style="margin: 10px 0 0 0; color: #666;">From ${companyName}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Bill To:</strong><br>${recipientName}<br>${recipientEmail}</p>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Rate</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>
          <div style="text-align: right; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${Number(invoice.subtotal).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Tax (${Number(invoice.tax_rate).toFixed(1)}%):</strong> $${Number(invoice.tax_amount).toFixed(2)}</p>
            <p style="margin: 10px 0 0 0; font-size: 1.2em;"><strong>Total:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
          </div>
          ${invoice.notes ? `<div style="margin-bottom: 20px;"><p><strong>Notes:</strong><br>${invoice.notes}</p></div>` : ''}
          ${invoice.terms ? `<div style="margin-bottom: 20px;"><p><strong>Terms:</strong><br>${invoice.terms}</p></div>` : ''}
          ${invoice.payment_instructions ? `<div style="margin-bottom: 20px;"><p><strong>Payment Instructions:</strong><br>${invoice.payment_instructions}</p></div>` : ''}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 0.9em;">
            <p>If you have any questions, please contact ${companyEmail || companyName}</p>
          </div>
        </body>
      </html>
    `;

    // Send email with Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${companyName} <invoices@smartreno.io>`,
      to: [recipientEmail],
      subject: `Invoice ${invoice.invoice_number} from ${companyName}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.txt`,
          content: btoa(pdfContent),
        },
      ],
    });

    if (emailError) {
      throw emailError;
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Failed to update invoice status:", updateError);
    }

    console.log("Invoice email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invoice sent successfully",
        emailId: emailData?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to generate simple text-based invoice
function generateInvoicePDF(invoice: any, companyName: string, companyEmail?: string, companyAddress?: string, companyPhone?: string, recipientName?: string): string {
  const lineItems = invoice.line_items as Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  const displayName = recipientName || invoice.client_name || invoice.homeowner_name || 'Customer';
  const displayEmail = invoice.client_email || invoice.homeowner_email || '';

  let content = `
================================================================================
                              ${companyName}
================================================================================
${companyAddress ? companyAddress + '\n' : ''}${companyPhone ? companyPhone + '\n' : ''}${companyEmail ? companyEmail + '\n' : ''}

                                INVOICE

Invoice #: ${invoice.invoice_number}
Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

--------------------------------------------------------------------------------
BILL TO:
${displayName}
${displayEmail}
${invoice.client_address || invoice.homeowner_address || ''}

--------------------------------------------------------------------------------
LINE ITEMS:
--------------------------------------------------------------------------------
Description                                  Qty    Unit Price      Amount
--------------------------------------------------------------------------------
`;

  lineItems.forEach(item => {
    const desc = item.description.padEnd(40);
    const qty = item.quantity.toString().padStart(6);
    const price = `$${item.unit_price.toFixed(2)}`.padStart(12);
    const amount = `$${item.amount.toFixed(2)}`.padStart(12);
    content += `${desc}${qty}${price}${amount}\n`;
  });

  content += `
--------------------------------------------------------------------------------
                                                  Subtotal: $${invoice.subtotal.toFixed(2)}
                                           Tax (${invoice.tax_rate}%): $${invoice.tax_amount.toFixed(2)}
                                                     TOTAL: $${invoice.total_amount.toFixed(2)}
================================================================================
`;

  if (invoice.notes) {
    content += `\nNOTES:\n${invoice.notes}\n\n`;
  }

  if (invoice.terms) {
    content += `\nTERMS:\n${invoice.terms}\n\n`;
  }

  if (invoice.payment_instructions) {
    content += `\nPAYMENT INSTRUCTIONS:\n${invoice.payment_instructions}\n\n`;
  }

  content += `\n\nThank you for your business!\n`;

  return content;
}
