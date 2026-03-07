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
  "Home Staging",
  "Engineering Consultant",
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
  "Home staging",
  "Material sourcing",
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
  "New construction",
  "Multi-family development",
  "Commercial interior renovation",
  "Condo / apartment renovation",
] as const;

export const ENGINEERING_SPECIALIZATION_OPTIONS = [
  "Residential structural",
  "Commercial structural",
  "Foundation design",
  "Steel / wood framing",
  "Retaining walls",
  "Load-bearing modifications",
  "Seismic retrofitting",
  "HVAC system design",
  "Plumbing system design",
  "Electrical system design",
  "Energy modeling / Title 24",
  "Civil / site engineering",
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

export const SERVICE_AREA_TYPE_OPTIONS = [
  { value: "radius", label: "Radius from primary location" },
  { value: "zip_codes", label: "Specific zip codes" },
  { value: "hybrid", label: "Radius + specific zip codes" },
] as const;

export const ENGINEERING_SERVICES_OPTIONS = [
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Energy compliance",
  "Seismic",
  "Foundation design",
] as const;

export const STAGING_SERVICES_OPTIONS = [
  "Full home staging",
  "Partial staging",
  "Consultation only",
  "Listing staging",
  "Vacant home staging",
] as const;

export const DESIGN_PACKAGE_SECTIONS = [
  { key: "project_overview", label: "Project Overview", weight: 10 },
  { key: "homeowner_vision", label: "Homeowner Vision", weight: 10 },
  { key: "existing_conditions", label: "Existing Conditions", weight: 15 },
  { key: "design_direction", label: "Design Direction", weight: 20 },
  { key: "permit_technical", label: "Permit / Technical Needs", weight: 10 },
  { key: "renderings", label: "Renderings", weight: 10 },
  { key: "selections", label: "Selections / Finishes", weight: 15 },
  { key: "contractor_handoff", label: "Contractor Handoff", weight: 10 },
] as const;

// Credential fields shown per specialty
export const CREDENTIAL_FIELDS_BY_SPECIALTY: Record<string, string[]> = {
  "Architecture": ["architect_license_number", "licensed_states", "aia_member", "ncarb", "architect_license_document_url", "architect_certificate_upload"],
  "Kitchen Design": ["nkba_member"],
  "Bath Design": ["nkba_member"],
  "Interior Design": ["leed_accredited"],
  "Drafting / Permit Plans": ["architect_license_number", "licensed_states"],
  "Engineering Consultant": ["engineering_services_supported"],
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
  if (profile?.zip_codes_served?.length > 0 || profile?.counties_served?.length > 0 || profile?.primary_service_zip) score += 10;
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

export function calculatePackageCompletion(sections: Array<{ section_key: string; is_complete: boolean }>): number {
  let total = 0;
  for (const sec of DESIGN_PACKAGE_SECTIONS) {
    const found = sections.find(s => s.section_key === sec.key);
    if (found?.is_complete) total += sec.weight;
  }
  return total;
}

export function isPackageReadyForRFP(sections: Array<{ section_key: string; is_complete: boolean }>, requireRenderings = false, requirePermit = false): boolean {
  const required = ["existing_conditions", "design_direction", "contractor_handoff"];
  if (requirePermit) required.push("permit_technical");
  if (requireRenderings) required.push("renderings");
  return required.every(key => sections.find(s => s.section_key === key)?.is_complete);
}
