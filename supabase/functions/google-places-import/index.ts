import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  formatted_phone_number?: string;
  website?: string;
  photos?: Array<{ photo_reference: string; html_attributions: string[] }>;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_PLACES_API_KEY is not configured. Please add it via Lovable Cloud secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { searchQuery, businessType, userId } = await req.json();

    if (!searchQuery || !businessType) {
      return new Response(
        JSON.stringify({ error: "searchQuery and businessType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Text Search via Google Places API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", searchData);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${searchData.status}`, details: searchData.error_message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const places: PlaceResult[] = searchData.results || [];
    let newImported = 0;
    let duplicatesSkipped = 0;

    for (const place of places) {
      // Check for duplicates by place_id
      const { data: existing } = await supabase
        .from("imported_businesses")
        .select("id")
        .eq("google_place_id", place.place_id)
        .maybeSingle();

      if (existing) {
        duplicatesSkipped++;
        continue;
      }

      // Step 2: Get Place Details for phone, website
      let details: PlaceResult = place;
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,address_components,photos&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        if (detailsData.status === "OK") {
          details = { ...place, ...detailsData.result };
        }
      } catch (e) {
        console.warn("Failed to fetch details for", place.place_id, e);
      }

      // Parse address components
      let city = "";
      let state = "NJ";
      let zip = "";
      if (details.address_components) {
        for (const comp of details.address_components) {
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) state = comp.short_name;
          if (comp.types.includes("postal_code")) zip = comp.long_name;
        }
      }

      // Build photo URL if available
      let photoUrl: string | null = null;
      let photoAttributions: string[] | null = null;
      if (details.photos && details.photos.length > 0) {
        const photo = details.photos[0];
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
        photoAttributions = photo.html_attributions;
      }

      // Determine category from types
      const category = details.types?.find((t: string) =>
        ["general_contractor", "plumber", "electrician", "roofing_contractor", "painter", "interior_designer", "architect"].includes(t)
      ) || (businessType === "contractor" ? "general_contractor" : "interior_designer");

      const slug = slugify(place.name + "-" + (city || "nj"));

      // Check slug uniqueness
      const { data: slugExists } = await supabase
        .from("imported_businesses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      const finalSlug = slugExists ? slug + "-" + place.place_id.slice(-6) : slug;

      const mapLink = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

      const serviceAreaTags = [city, state, zip].filter(Boolean);

      const { error: insertError } = await supabase.from("imported_businesses").insert({
        business_type: businessType,
        slug: finalSlug,
        business_name: place.name,
        category,
        primary_type: details.types?.[0] || null,
        address: place.formatted_address || null,
        city,
        state,
        zip,
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        google_rating: place.rating || null,
        review_count: place.user_ratings_total || 0,
        google_place_id: place.place_id,
        map_link: mapLink,
        business_status: place.business_status?.toLowerCase() || "operational",
        service_area_tags: serviceAreaTags,
        photo_url: photoUrl,
        photo_attributions: photoAttributions ? JSON.stringify(photoAttributions) : null,
        search_query: searchQuery,
        raw_place_data: place,
      });

      if (insertError) {
        console.error("Insert error for", place.name, insertError);
      } else {
        newImported++;
      }
    }

    // Log the import
    await supabase.from("google_places_import_logs").insert({
      search_query: searchQuery,
      business_type: businessType,
      results_found: places.length,
      new_imported: newImported,
      duplicates_skipped: duplicatesSkipped,
      imported_by: userId || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        results_found: places.length,
        new_imported: newImported,
        duplicates_skipped: duplicatesSkipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
