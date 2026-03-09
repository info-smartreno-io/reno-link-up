import { supabase } from "@/integrations/supabase/client";

type FormLogData = {
  form_name: string;
  submission_data: Record<string, any>;
  user_id?: string;
  status?: "success" | "error";
  error_message?: string;
};

export async function logFormSubmission(data: FormLogData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("form_logs" as any).insert({
      form_name: data.form_name,
      submission_data: data.submission_data,
      user_id: data.user_id || user?.id || null,
      status: data.status || "success",
      error_message: data.error_message || null,
    });
  } catch (err) {
    console.error("Failed to log form submission:", err);
  }
}

export async function savePropertyReport(reportData: {
  address: string;
  city?: string;
  zip?: string;
  squareFeet?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  selectedScopes?: string[];
  estimatedCostLow?: number;
  estimatedCostHigh?: number;
  propertyData?: Record<string, any>;
}): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("property_reports" as any)
      .insert({
        address: reportData.address,
        city: reportData.city || null,
        zip: reportData.zip || null,
        square_feet: reportData.squareFeet || null,
        year_built: reportData.yearBuilt || null,
        bedrooms: reportData.bedrooms || null,
        bathrooms: reportData.bathrooms || null,
        lot_size: reportData.lotSize || null,
        selected_scopes: reportData.selectedScopes || [],
        estimated_cost_low: reportData.estimatedCostLow || null,
        estimated_cost_high: reportData.estimatedCostHigh || null,
        property_data: reportData.propertyData || null,
        user_id: user?.id || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save property report:", error);
      return null;
    }

    await logFormSubmission({
      form_name: "property_evaluation",
      submission_data: reportData,
      status: "success",
    });

    return data?.id || null;
  } catch (err) {
    console.error("Failed to save property report:", err);
    return null;
  }
}
