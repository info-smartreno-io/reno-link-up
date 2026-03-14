import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { securityLogger } from '../_shared/securityLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      const error = new Error('Missing stripe-signature header');
      await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', error);
      throw error;
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      const error = new Error('STRIPE_WEBHOOK_SECRET not configured');
      await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', error);
      throw error;
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Received Stripe webhook event:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentType = (session.metadata?.paymentType as string) || 'estimate_fee';

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (paymentType === 'invoice') {
        const invoiceId = session.metadata?.invoiceId;
        if (!invoiceId) {
          const err = new Error('Missing invoiceId in session metadata');
          await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', err, undefined, {
            sessionId: session.id,
            metadata: session.metadata,
          });
          throw err;
        }
        const amountDollars = (session.amount_total || 0) / 100;
        const { data: invoice } = await supabase
          .from('invoices')
          .select('homeowner_id, user_id')
          .eq('id', invoiceId)
          .single();
        const recordedBy = invoice?.homeowner_id ?? invoice?.user_id;
        if (!recordedBy) {
          const err = new Error('Invoice has no homeowner_id or user_id for recorded_by');
          await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', err, undefined, { invoiceId });
          throw err;
        }
        const { error: ipError } = await supabase.from('invoice_payments').insert({
          invoice_id: invoiceId,
          amount: amountDollars,
          payment_method: 'stripe',
          transaction_id: session.id,
          recorded_by: recordedBy,
        });
        if (ipError) {
          console.error('Error creating invoice_payment:', ipError);
          await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', ipError, recordedBy, { invoiceId });
          throw ipError;
        }
        console.log('Recorded invoice payment:', invoiceId, session.id);
      } else {
        const { projectId, homeownerId } = session.metadata || {};
        if (!projectId || !homeownerId) {
          const error = new Error('Missing required metadata');
          console.error('Missing metadata in session:', session.id);
          await securityLogger.logEdgeFunctionError(req, 'verify-estimate-payment', error, homeownerId, {
            sessionId: session.id,
            metadata: session.metadata,
          });
          throw error;
        }

        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: homeownerId,
            project_id: projectId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            payment_type: paymentType || 'estimate_fee',
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              session_metadata: session.metadata,
              customer_email: session.customer_details?.email,
            }
          })
          .select()
          .single();

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
          await securityLogger.logEdgeFunctionError(
            req,
            'verify-estimate-payment',
            paymentError,
            homeownerId,
            { projectId }
          );
          throw paymentError;
        }

        console.log('Created payment record:', payment.id);

        const { error: projectError } = await supabase
          .from('projects')
          .update({
            workflow_status: 'payment_confirmed',
            payment_confirmed_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (projectError) {
          console.error('Error updating project:', projectError);
          await securityLogger.logEdgeFunctionError(
            req,
            'verify-estimate-payment',
            projectError,
            homeownerId,
            { projectId }
          );
          throw projectError;
        }

        console.log('Updated project workflow status:', projectId);

        const { error: assignError } = await supabase.functions.invoke('ai-scheduling-routing', {
          body: { projectId }
        });

        if (assignError) {
          console.error('Error triggering AI scheduling:', assignError);
          await securityLogger.logEdgeFunctionError(
            req,
            'verify-estimate-payment',
            assignError,
            homeownerId,
            { projectId, step: 'ai-scheduling-routing' }
          );
          const { error: fallbackError } = await supabase.functions.invoke('assign-estimator', {
            body: { projectId }
          });
          if (fallbackError) {
            console.error('Fallback assignment also failed:', fallbackError);
          }
        } else {
          console.log('AI scheduling completed for project:', projectId);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    await securityLogger.logEdgeFunctionError(
      req,
      'verify-estimate-payment',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});