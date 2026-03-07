export const SPECIALTY_OPTIONS = [
  "Interior Design",
  "Architecture",
  "Kitchen Design",
  "Bath Design",
  "Drafting / Permit Plans",
  "Space Planning",
  "3D Rendering",
  "Material / Finish Selection",
  "Addition / Expansion Planning",
  "Exterior Design",
  "Landscape Design",
  "Lighting Design",
  "Custom Millwork / Cabinet Design",
] as const;

export const SERVICE_OPTIONS = [
  "Initial design consultation",
  "In-home consultation",
  "Virtual consultation",
  "Full interior design package",
  "Kitchen design",
  "Bathroom design",
  "Addition planning",
  "Floor plan redesign",
  "Permit / construction drawings",
  "As-built drawings",
  "3D renderings",
  "Mood boards",
  "Finish selections",
  "Fixture selections",
  "Cabinet layout",
  "Material specification sheet",
  "Contractor handoff package",
  "Ongoing construction support",
  "Site visits during construction",
] as const;

export const PROJECT_TYPE_OPTIONS = [
  "Kitchen remodel",
  "Bathroom remodel",
  "Basement remodel",
  "Full home renovation",
  "Addition",
  "Interior reconfiguration",
  "Exterior renovation",
  "Outdoor living",
  "Commercial interior renovation",
  "Condo / apartment renovation",
] as const;

export const BUDGET_RANGE_OPTIONS = [
  "Under $10K",
  "$10K–$25K",
  "$25K–$50K",
  "$50K–$100K",
  "$100K–$250K",
  "$250K+",
] as const;

export const PRICING_MODEL_OPTIONS = [
  "Hourly",
  "Flat consultation fee",
  "Fixed design package",
  "Per-room pricing",
  "Percentage of project cost",
  "Custom quote",
] as const;

export const LEAD_TYPE_OPTIONS = [
  "Design only",
  "Design + construction coordination",
  "Permit / drawing only",
  "High-end renovations",
  "Quick consultations",
] as const;

export const COMMUNICATION_OPTIONS = [
  "App messaging",
  "Email",
  "Phone",
  "Video call",
] as const;

export const CONSULTATION_AVAILABILITY_OPTIONS = [
  { value: "48_hours", label: "Within 48 hours" },
  { value: "1_week", label: "Within 1 week" },
  { value: "2_weeks", label: "Within 2 weeks" },
  { value: "1_month_plus", label: "1 month+" },
] as const;

export const SERVICE_MODE_OPTIONS = [
  { value: "in_person", label: "In-person only" },
  { value: "virtual", label: "Virtual only" },
  { value: "both", label: "Both" },
] as const;

// Credential fields shown per specialty
export const CREDENTIAL_FIELDS_BY_SPECIALTY: Record<string, string[]> = {
  "Architecture": ["architect_license_number", "licensed_states", "aia_member", "ncarb"],
  "Kitchen Design": ["nkba_member"],
  "Bath Design": ["nkba_member"],
  "Interior Design": ["leed_accredited"],
  "Drafting / Permit Plans": ["architect_license_number", "licensed_states"],
};

export function getCredentialFieldsForSpecialties(specialties: string[]): string[] {
  const fields = new Set<string>();
  specialties.forEach((s) => {
    const f = CREDENTIAL_FIELDS_BY_SPECIALTY[s];
    if (f) f.forEach((field) => fields.add(field));
  });
  // Always show these
  fields.add("insurance_status");
  fields.add("business_registered");
  return Array.from(fields);
}

export function calculateProfileCompletion(profile: any): number {
  let score = 0;
  // Basic info (15%)
  if (profile?.company_name) score += 5;
  if (profile?.profile_photo_url) score += 5;
  if (profile?.company_logo_url) score += 5;
  // Specialties/services (15%)
  if (profile?.specialties?.length > 0) score += 8;
  if (profile?.services_offered?.length > 0) score += 7;
  // Service area (10%)
  if (profile?.zip_codes_served?.length > 0 || profile?.counties_served?.length > 0) score += 10;
  // Credentials (15%)
  if (profile?.insurance_status || profile?.architect_license_number) score += 15;
  // Portfolio (20%) - handled separately
  // Availability (10%)
  if (profile?.consultation_availability) score += 5;
  if (profile?.accepting_new_projects !== undefined) score += 5;
  // Pricing (5%)
  if (profile?.pricing_model?.length > 0) score += 5;
  // Bio (10%)
  if (profile?.headline) score += 5;
  if (profile?.full_bio) score += 5;
  return Math.min(score, 80); // Max 80 without portfolio
}
