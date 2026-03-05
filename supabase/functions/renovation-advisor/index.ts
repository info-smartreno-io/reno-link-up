import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(5000, "Message too long"),
});

const RenovationAdvisorSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message required").max(20, "Too many messages"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = RenovationAdvisorSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { messages } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are SmartReno's AI Renovation Advisor, a helpful assistant specializing in home renovation projects in Northern New Jersey.

Your expertise includes:
- Kitchen, bathroom, basement, and home addition projects
- Cost estimates and budgeting guidance
- Permit requirements for NJ (Bergen, Passaic, Morris, Essex, Hudson counties)
- Material recommendations (GAF roofing, Hardie siding, MSI tiles, Andersen windows)
- Design trends and style advice
- Timeline expectations
- Contractor selection guidance
- Common renovation pitfalls to avoid

Communication style:
- Be warm, friendly, and encouraging
- Provide specific, actionable advice
- Keep responses concise (2-3 paragraphs max)
- Use simple language, avoid jargon
- When discussing costs, always provide ranges
- Suggest SmartReno's services naturally when relevant
- If asked about something outside your expertise, acknowledge limitations

Key facts about SmartReno:
- One intake form gets homeowners 3 competitive bids
- Serves Northern NJ (Bergen, Passaic, Morris, Essex, Hudson counties)
- Vets all contractors for licensing, insurance, reviews
- Provides expert guidance throughout the project
- Specializes in kitchens, bathrooms, basements, additions, siding, windows

Do NOT:
- Give exact prices (always provide ranges)
- Make legal or structural engineering recommendations
- Guarantee permit approval
- Recommend specific contractors by name`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    console.log("Renovation advisor response generated");

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in renovation-advisor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
