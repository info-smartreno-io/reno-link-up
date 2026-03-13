import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteVisitPayload {
  projectId: string;
  scheduledAt: string;
  visitWith: string;
  address?: string | null;
}

// Create a short-lived JWT for Google service account
async function getServiceAccountJwt(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account env vars not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const header = { alg: "RS256", typ: "JWT" };
  const base64url = (input: string) =>
    btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(
      atob(
        privateKey
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace(/\s+/g, "")
      ),
      (c) => c.charCodeAt(0)
    ),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken),
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signatureBase64}`;
}

async function getAccessToken(): Promise<string> {
  const jwt = await getServiceAccountJwt();

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Google OAuth error:", text);
    throw new Error("Failed to obtain Google access token");
  }

  const data = await resp.json();
  return data.access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as SiteVisitPayload;
    const calendarId = Deno.env.get("GOOGLE_SITE_VISIT_CALENDAR_ID");
    if (!calendarId) {
      throw new Error("GOOGLE_SITE_VISIT_CALENDAR_ID env var not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch homeowner + basic project info for context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, project_type, project_name, address, city, zip_code")
      .eq("id", payload.projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found for site visit");
    }

    const { data: user } = await supabase
      .from("users")
      .select("full_name, email, phone")
      .eq("id", project.user_id)
      .maybeSingle();

    const start = new Date(payload.scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const summary = `Site visit: ${project.project_type || "Renovation"}`;
    const address =
      payload.address ||
      [project.address, project.city, project.zip_code].filter(Boolean).join(", ");

    const roleLabel = (() => {
      switch (payload.visitWith) {
        case "construction_agent":
          return "Construction Agent";
        case "client_success":
          return "Client Success";
        case "pm":
          return "Project Manager";
        case "design_pro":
          return "Design Pro";
        default:
          return "SmartReno Team";
      }
    })();

    const descriptionLines = [
      `Homeowner: ${user?.full_name || "Unknown"}`,
      user?.email ? `Email: ${user.email}` : null,
      user?.phone ? `Phone: ${user.phone}` : null,
      address ? `Address: ${address}` : null,
      "",
      `Visit with: ${roleLabel}`,
      `Project type: ${project.project_type || project.project_name || "Renovation"}`,
      "",
      "This event was created from the SmartReno homeowner portal.",
    ]
      .filter(Boolean)
      .join("\n");

    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          location: address || undefined,
          description: descriptionLines,
          start: {
            dateTime: start.toISOString(),
            timeZone: "America/New_York",
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: "America/New_York",
          },
          reminders: {
            useDefault: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Google Calendar create event error:", text);
      throw new Error("Failed to create Google Calendar event");
    }

    const event = await response.json();

    return new Response(
      JSON.stringify({ success: true, eventId: event.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in homeowner-site-visit-calendar:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

