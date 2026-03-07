import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { useDesignProfessionalProfile } from "@/hooks/useDesignProfessionalProfile";
import { FileUploadField } from "@/components/design-professional/FileUploadField";
import {
  SPECIALTY_OPTIONS,
  SERVICE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  BUDGET_RANGE_OPTIONS,
  PRICING_MODEL_OPTIONS,
  LEAD_TYPE_OPTIONS,
  COMMUNICATION_OPTIONS,
  CONSULTATION_AVAILABILITY_OPTIONS,
  SERVICE_MODE_OPTIONS,
  SERVICE_AREA_TYPE_OPTIONS,
  ENGINEERING_SERVICES_OPTIONS,
  STAGING_SERVICES_OPTIONS,
  getCredentialFieldsForSpecialties,
} from "@/config/designProfessionalOptions";

export default function DesignProfessionalProfile() {
  const { profile, isLoading, upsertProfile } = useDesignProfessionalProfile();
  const [form, setForm] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleArrayItem = (key: string, item: string) => {
    const arr = form[key] || [];
    const next = arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item];
    update(key, next);
  };

  const handleSave = () => {
    const { id, created_at, user_id, ...updates } = form;
    upsertProfile.mutate(updates);
    setDirty(false);
  };

  const specialties = form.specialties || [];
  const credentialFields = getCredentialFieldsForSpecialties(specialties);
  const hasArchitecture = specialties.includes("Architecture") || specialties.includes("Drafting / Permit Plans");
  const hasStaging = specialties.includes("Home Staging");
  const hasEngineering = specialties.includes("Engineering Consultant");

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your design professional profile</p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || upsertProfile.isPending}>
          {upsertProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Identity & Basic Info */}
      <Card>
        <CardHeader><CardTitle>Identity & Basic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Company Name</Label><Input value={form.company_name || ""} onChange={(e) => update("company_name", e.target.value)} /></div>
          <div><Label>Brand Name</Label><Input value={form.brand_name || ""} onChange={(e) => update("brand_name", e.target.value)} /></div>
          <div><Label>Website</Label><Input value={form.website || ""} onChange={(e) => update("website", e.target.value)} /></div>
          <div><Label>Instagram / Portfolio Link</Label><Input value={form.instagram_or_portfolio_link || ""} onChange={(e) => update("instagram_or_portfolio_link", e.target.value)} /></div>
          <div><Label>Business Address</Label><Input value={form.business_address || ""} onChange={(e) => update("business_address", e.target.value)} /></div>
          <div><Label>Years in Business</Label><Input type="number" value={form.years_in_business || ""} onChange={(e) => update("years_in_business", parseInt(e.target.value) || null)} /></div>
          <div><Label>Team Size</Label><Input type="number" value={form.team_size || ""} onChange={(e) => update("team_size", parseInt(e.target.value) || null)} /></div>
          <FileUploadField label="Profile Photo" bucket="design-professional-credentials" currentUrl={form.profile_photo_url} onUpload={(url) => update("profile_photo_url", url)} onRemove={() => update("profile_photo_url", null)} accept=".jpg,.jpeg,.png,.webp" />
          <FileUploadField label="Company Logo" bucket="design-professional-credentials" currentUrl={form.company_logo_url} onUpload={(url) => update("company_logo_url", url)} onRemove={() => update("company_logo_url", null)} accept=".jpg,.jpeg,.png,.webp" />
        </CardContent>
      </Card>

      {/* Bio & Brand */}
      <Card>
        <CardHeader><CardTitle>Bio & Brand Positioning</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Headline</Label><Input value={form.headline || ""} onChange={(e) => update("headline", e.target.value)} placeholder="e.g. Award-Winning Interior Designer" /></div>
          <div><Label>Brand Positioning</Label><Textarea value={form.brand_positioning || ""} onChange={(e) => update("brand_positioning", e.target.value)} rows={2} placeholder="What sets you apart from the competition" /></div>
          <div><Label>Full Bio</Label><Textarea value={form.full_bio || ""} onChange={(e) => update("full_bio", e.target.value)} rows={4} /></div>
          <div><Label>Design Philosophy</Label><Textarea value={form.design_philosophy || ""} onChange={(e) => update("design_philosophy", e.target.value)} rows={3} /></div>
          <div><Label>Unique Value Proposition</Label><Textarea value={form.unique_value_proposition || ""} onChange={(e) => update("unique_value_proposition", e.target.value)} rows={2} /></div>
          <div><Label>Ideal Client Type</Label><Input value={form.ideal_client_type || ""} onChange={(e) => update("ideal_client_type", e.target.value)} /></div>
          <div><Label>Notable Projects Summary</Label><Textarea value={form.notable_projects_summary || ""} onChange={(e) => update("notable_projects_summary", e.target.value)} rows={2} /></div>
          <div><Label>Awards / Publications</Label><Textarea value={form.awards_or_publications || ""} onChange={(e) => update("awards_or_publications", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader><CardTitle>Professional Specialties</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SPECIALTY_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={specialties.includes(s)} onCheckedChange={() => toggleArrayItem("specialties", s)} />
                {s}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader><CardTitle>Services Offered</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={(form.services_offered || []).includes(s)} onCheckedChange={() => toggleArrayItem("services_offered", s)} />
                {s}
              </label>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.do_you_source_materials || false} onCheckedChange={(v) => update("do_you_source_materials", v)} />
              <Label>Do you source materials?</Label>
            </div>
            {form.do_you_source_materials && (
              <div><Label>Material Sourcing Notes</Label><Input value={form.material_sourcing_notes || ""} onChange={(e) => update("material_sourcing_notes", e.target.value)} /></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Types */}
      <Card>
        <CardHeader><CardTitle>Project Types Supported</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PROJECT_TYPE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={(form.project_types || []).includes(s)} onCheckedChange={() => toggleArrayItem("project_types", s)} />
                {s}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader><CardTitle>Budget Range Experience</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUDGET_RANGE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={(form.budget_ranges || []).includes(s)} onCheckedChange={() => toggleArrayItem("budget_ranges", s)} />
                {s}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardHeader><CardTitle>Service Area</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Service Area Type</Label>
            <Select value={form.service_area_type || "radius"} onValueChange={(v) => update("service_area_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_AREA_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Primary Service Zip</Label><Input value={form.primary_service_zip || ""} onChange={(e) => update("primary_service_zip", e.target.value)} placeholder="e.g. 07652" /></div>
          <div><Label>Primary City</Label><Input value={form.primary_service_city || ""} onChange={(e) => update("primary_service_city", e.target.value)} /></div>
          <div><Label>Primary State</Label><Input value={form.primary_service_state || ""} onChange={(e) => update("primary_service_state", e.target.value)} /></div>
          {(form.service_area_type === "radius" || form.service_area_type === "hybrid") && (
            <div><Label>Service Radius (miles)</Label><Input type="number" value={form.service_radius_miles || form.travel_radius_miles || ""} onChange={(e) => update("service_radius_miles", parseInt(e.target.value) || null)} /></div>
          )}
          {(form.service_area_type === "zip_codes" || form.service_area_type === "hybrid") && (
            <div>
              <Label>Zip Codes Served (comma-separated)</Label>
              <Input value={(form.zip_codes_served || []).join(", ")} onChange={(e) => update("zip_codes_served", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>
          )}
          <div>
            <Label>Counties Served (comma-separated)</Label>
            <Input value={(form.counties_served || []).join(", ")} onChange={(e) => update("counties_served", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <Label>Service Mode</Label>
            <Select value={form.service_mode || "both"} onValueChange={(v) => update("service_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.willing_to_travel_for_premium_projects || false} onCheckedChange={(v) => update("willing_to_travel_for_premium_projects", v)} />
            <Label>Willing to travel for premium projects</Label>
          </div>
          <div className="md:col-span-2"><Label>Region Notes</Label><Input value={form.region_notes || ""} onChange={(e) => update("region_notes", e.target.value)} /></div>
        </CardContent>
      </Card>

      {/* Credentials (Dynamic) */}
      <Card>
        <CardHeader><CardTitle>Credentials & Licensing</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentialFields.includes("architect_license_number") && (
            <div><Label>Architect License Number</Label><Input value={form.architect_license_number || ""} onChange={(e) => update("architect_license_number", e.target.value)} /></div>
          )}
          {credentialFields.includes("licensed_states") && (
            <div>
              <Label>Licensed States (comma-separated)</Label>
              <Input value={(form.licensed_states || []).join(", ")} onChange={(e) => update("licensed_states", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>
          )}
          {credentialFields.includes("aia_member") && (
            <label className="flex items-center gap-2"><Checkbox checked={form.aia_member || false} onCheckedChange={(v) => update("aia_member", v)} /> AIA Member</label>
          )}
          {credentialFields.includes("ncarb") && (
            <label className="flex items-center gap-2"><Checkbox checked={form.ncarb || false} onCheckedChange={(v) => update("ncarb", v)} /> NCARB Certified</label>
          )}
          {credentialFields.includes("nkba_member") && (
            <label className="flex items-center gap-2"><Checkbox checked={form.nkba_member || false} onCheckedChange={(v) => update("nkba_member", v)} /> NKBA Member</label>
          )}
          {credentialFields.includes("leed_accredited") && (
            <label className="flex items-center gap-2"><Checkbox checked={form.leed_accredited || false} onCheckedChange={(v) => update("leed_accredited", v)} /> LEED Accredited</label>
          )}
          <div>
            <Label>Insurance Status</Label>
            <Select value={form.insurance_status || ""} onValueChange={(v) => update("insurance_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={form.business_registered || false} onCheckedChange={(v) => update("business_registered", v)} /> Business Registered
          </label>
          <div className="md:col-span-2">
            <Label>Certification Notes</Label>
            <Textarea value={form.certification_notes || ""} onChange={(e) => update("certification_notes", e.target.value)} rows={2} />
          </div>

          {/* Credential Document Uploads */}
          {hasArchitecture && (
            <>
              <FileUploadField label="Architect License Document" bucket="design-professional-credentials" currentUrl={form.architect_license_document_url} onUpload={(url) => update("architect_license_document_url", url)} onRemove={() => update("architect_license_document_url", null)} />
              <FileUploadField label="Architect Certificate" bucket="design-professional-credentials" currentUrl={form.architect_certificate_upload} onUpload={(url) => update("architect_certificate_upload", url)} onRemove={() => update("architect_certificate_upload", null)} />
            </>
          )}
          <FileUploadField label="Insurance Certificate" bucket="design-professional-credentials" currentUrl={form.insurance_certificate_upload} onUpload={(url) => update("insurance_certificate_upload", url)} onRemove={() => update("insurance_certificate_upload", null)} />
          <FileUploadField label="Business Registration" bucket="design-professional-credentials" currentUrl={form.business_registration_document} onUpload={(url) => update("business_registration_document", url)} onRemove={() => update("business_registration_document", null)} />
        </CardContent>
      </Card>

      {/* Engineering Coordination */}
      {hasEngineering && (
        <Card>
          <CardHeader><CardTitle>Engineering Coordination</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.can_coordinate_engineering || false} onCheckedChange={(v) => update("can_coordinate_engineering", v)} />
                <Label>Can coordinate engineering</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.works_with_structural_engineer || false} onCheckedChange={(v) => update("works_with_structural_engineer", v)} />
                <Label>Works with structural engineer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.works_with_mep_engineer || false} onCheckedChange={(v) => update("works_with_mep_engineer", v)} />
                <Label>Works with MEP engineer</Label>
              </div>
            </div>
            <div>
              <Label>Engineering Services Supported</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                {ENGINEERING_SERVICES_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={(form.engineering_services_supported || []).includes(s)} onCheckedChange={() => toggleArrayItem("engineering_services_supported", s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staging */}
      {hasStaging && (
        <Card>
          <CardHeader><CardTitle>Home Staging</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Staging Services Offered</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {STAGING_SERVICES_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={(form.staging_services_offered || []).includes(s)} onCheckedChange={() => toggleArrayItem("staging_services_offered", s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.inventory_available || false} onCheckedChange={(v) => update("inventory_available", v)} />
                <Label>Inventory Available</Label>
              </div>
              <div><Label>Avg Staging Cost Range</Label><Input value={form.average_staging_cost_range || ""} onChange={(e) => update("average_staging_cost_range", e.target.value)} placeholder="e.g. $2,000 - $5,000" /></div>
              <div><Label>Turnaround (days)</Label><Input type="number" value={form.staging_turnaround_time_days || ""} onChange={(e) => update("staging_turnaround_time_days", parseInt(e.target.value) || null)} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability */}
      <Card>
        <CardHeader><CardTitle>Availability & Lead Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.accepting_new_projects ?? true} onCheckedChange={(v) => update("accepting_new_projects", v)} />
            <Label>Accepting New Projects</Label>
          </div>
          <div>
            <Label>Consultation Availability</Label>
            <Select value={form.consultation_availability || "1_week"} onValueChange={(v) => update("consultation_availability", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONSULTATION_AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preferred Lead Types</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {LEAD_TYPE_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(form.preferred_lead_types || []).includes(s)} onCheckedChange={() => toggleArrayItem("preferred_lead_types", s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Preferred Communication</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {COMMUNICATION_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(form.preferred_communication || []).includes(s)} onCheckedChange={() => toggleArrayItem("preferred_communication", s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Pricing / Fee Structure</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pricing Models</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
              {PRICING_MODEL_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(form.pricing_model || []).includes(s)} onCheckedChange={() => toggleArrayItem("pricing_model", s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Starting Consultation Fee ($)</Label><Input type="number" value={form.starting_consultation_fee || ""} onChange={(e) => update("starting_consultation_fee", parseFloat(e.target.value) || null)} /></div>
            <div><Label>Minimum Project Size ($)</Label><Input type="number" value={form.minimum_project_size || ""} onChange={(e) => update("minimum_project_size", parseFloat(e.target.value) || null)} /></div>
          </div>
          <div><Label>Pricing Notes</Label><Textarea value={form.pricing_notes || ""} onChange={(e) => update("pricing_notes", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || upsertProfile.isPending} size="lg">
          {upsertProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
