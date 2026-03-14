import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequestSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(50),
  amountCents: z.number().int().min(0).max(100000000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const requestBody = await req.json();
    const parsed = RequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Provide invoiceNumber and optional amountCents." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { invoiceNumber, amountCents } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, amount_paid, status, homeowner_id, user_id, homeowner_name")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found. Check the invoice number and try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "This invoice is no longer open for payment." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const totalCents = amountCents ?? Math.round(Number(invoice.total_amount) * 100);
    const amountDueDollars = Number(invoice.total_amount) - Number(invoice.amount_paid);
    const amountDueCents = Math.round(amountDueDollars * 100);

    if (totalCents <= 0) {
      return new Response(
        JSON.stringify({ error: "This invoice has no amount due." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (totalCents > amountDueCents) {
      return new Response(
        JSON.stringify({ error: `Amount due is $${(amountDueCents / 100).toFixed(2)}. Please enter that amount or less.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://smartreno.io";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for invoice ${invoice.invoice_number}${invoice.homeowner_name ? ` – ${invoice.homeowner_name}` : ""}`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        paymentType: "invoice",
      },
      success_url: `${origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payments`,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("create-invoice-checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
