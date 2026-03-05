import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { securityLogger } from '../_shared/securityLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AddonSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  price: z.number().int().min(0).max(1000000),
});

const CheckoutRequestSchema = z.object({
  projectId: z.string().uuid(),
  homeownerId: z.string().uuid(),
  estimateFee: z.number().int().min(0).max(1000000).optional(),
  addons: z.array(AddonSchema).max(10).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const requestBody = await req.json();
    
    // Validate input with security logging
    let validatedData;
    try {
      validatedData = CheckoutRequestSchema.parse(requestBody);
    } catch (validationError) {
      await securityLogger.logValidationError(
        req,
        'create-estimate-checkout',
        validationError,
        requestBody.homeownerId
      );
      throw new Error('Invalid request data');
    }
    
    const { projectId, homeownerId, estimateFee, addons } = validatedData;

    // Calculate total amount
    const baseAmount = estimateFee || 14999; // $149.99 in cents
    const addonsTotal = (addons || []).reduce((sum: number, addon: any) => sum + (addon.price || 0), 0);
    const totalAmount = baseAmount + addonsTotal;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SmartReno Estimate Fee',
              description: 'Professional home renovation estimate with SmartEstimate AI',
            },
            unit_amount: baseAmount,
          },
          quantity: 1,
        },
        ...(addons || []).map((addon: any) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: addon.name,
              description: addon.description || '',
            },
            unit_amount: addon.price,
          },
          quantity: 1,
        })),
      ],
      metadata: {
        projectId,
        homeownerId,
        paymentType: 'estimate_fee',
      },
      success_url: `${req.headers.get('origin')}/homeowner/estimate-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/homeowner/estimate-cancelled`,
    });

    console.log('Created checkout session:', session.id, 'for project:', projectId);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Log the error
    await securityLogger.logEdgeFunctionError(
      req,
      'create-estimate-checkout',
      error instanceof Error ? error : new Error('Unknown error'),
      undefined,
      { projectId: await req.json().then(d => d.projectId).catch(() => 'unknown') }
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