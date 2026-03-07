import { useState, useEffect } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useContractorOnboarding, useContractorId } from "@/hooks/contractor/useContractorOnboarding";
import { useContractorProfile } from "@/hooks/contractor/useContractorProfile";
import { ContractorTermsOfService } from "@/components/contractor/ContractorTermsOfService";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Building2, Wrench, Upload, FileSpreadsheet, Image, Send,
  CheckCircle, ChevronRight, ChevronLeft, Loader2, Users, Briefcase, MapPin, Globe,
  FileText, ShieldCheck, Clock
} from "lucide-react";

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Operations", icon: Clock },
  { label: "Trades", icon: Wrench },
  { label: "Service Area", icon: MapPin },
  { label: "Licensing", icon: ShieldCheck },
  { label: "Documents", icon: FileText },
  { label: "Cost Codes", icon: FileSpreadsheet },
  { label: "Portfolio", icon: Image },
  { label: "Terms", icon: ShieldCheck },
  { label: "Submit", icon: Send },
];

const TRADES = [
  "General Contracting", "Interior Remodeling", "Exterior Remodeling", "Additions",
  "Kitchen Remodeling", "Bathroom Remodeling", "Basement Finishing",
  "Framing", "Drywall", "Painting", "Flooring", "Tile",
  "Electrical", "Plumbing", "HVAC",
  "Roofing", "Siding", "Windows",
  "Masonry", "Hardscape", "Concrete",
  "Decks", "Outdoor Living", "Landscaping",
  "Commercial Renovation",
];

const PROJECT_TYPES = [
  "Interior Remodeling", "Exterior Remodeling", "Additions", "Kitchens",
  "Bathrooms", "Basements", "Whole Home Renovations", "Outdoor Living", "Commercial Projects",
];

const SUB_TRADES = [
  "Electrical", "Plumbing", "HVAC", "Framing", "Tile",
  "Painting", "Roofing", "Concrete", "Landscaping", "Other",
];

export default function ContractorOnboardingWizard() {
  const [step, setStep] = useState(0);
  const { data: onboarding, isLoading: onbLoading, updateOnboarding } = useContractorOnboarding();
  const { data: profile, isLoading: profLoading, updateProfile } = useContractorProfile();
  const { data: contractorId } = useContractorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Company Info
  const [companyAddress, setCompanyAddress] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [crewSize, setCrewSize] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("owner");

  // Social
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [houzzUrl, setHouzzUrl] = useState("");

  // Operations
  const [businessType, setBusinessType] = useState("general_contractor");
  const [hasOffice, setHasOffice] = useState(false);
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeStaffCount, setOfficeStaffCount] = useState("");
  const [pmCount, setPmCount] = useState("");
  const [estimatorCount, setEstimatorCount] = useState("");
  const [hasDesigner, setHasDesigner] = useState(false);
  const [designerCount, setDesignerCount] = useState("");
  const [hasEstimator, setHasEstimator] = useState(false);
  const [leadForemanCount, setLeadForemanCount] = useState("");
  const [workType, setWorkType] = useState("mix");
  const [usesSubs, setUsesSubs] = useState(false);
  const [subTrades, setSubTrades] = useState<string[]>([]);
  const [isBonded, setIsBonded] = useState(false);
  const [operatingDays, setOperatingDays] = useState("mon_fri");
  const [operatingStart, setOperatingStart] = useState("08:00");
  const [operatingEnd, setOperatingEnd] = useState("17:00");
  const [bidTurnaround, setBidTurnaround] = useState("");
  const [concurrentProjects, setConcurrentProjects] = useState("");

  // Trades & Experience
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [typicalBudget, setTypicalBudget] = useState("");
  const [avgProjectsPerYear, setAvgProjectsPerYear] = useState("");
  const [typicalDuration, setTypicalDuration] = useState("");
  const [largestProjectValue, setLargestProjectValue] = useState("");
  const [largestProjectDuration, setLargestProjectDuration] = useState("");

  // Service Area
  const [serviceZips, setServiceZips] = useState("");
  const [serviceCounties, setServiceCounties] = useState("");
  const [serviceCities, setServiceCities] = useState("");

  // Licensing
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiration, setLicenseExpiration] = useState("");
  const [workersComp, setWorkersComp] = useState(false);

  // Uploads
  const [uploading, setUploading] = useState(false);

  // Cost codes
  const [costCodeFile, setCostCodeFile] = useState<File | null>(null);
  const [parsedCodes, setParsedCodes] = useState<any[]>([]);
  const [parsingCodes, setParsingCodes] = useState(false);

  // Portfolio
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  // Init from existing data
  useEffect(() => {
    if (onboarding) {
      setCompanyAddress(onboarding.company_address || "");
      setYearsInBusiness(onboarding.years_in_business?.toString() || "");
      setCrewSize(onboarding.crew_size?.toString() || "");
      setSelectedTrades(onboarding.trades || []);
    }
  }, [onboarding]);

  useEffect(() => {
    if (profile) {
      setBusinessPhone(profile.business_phone || profile.phone || "");
      setBusinessEmail(profile.business_email || profile.email || "");
      setWebsite(profile.website || "");
      setContactName((profile as any).contact_name || "");
      setContactRole((profile as any).contact_role || "owner");
      setGoogleBusinessUrl(profile.google_business_url || "");
      setInstagramUrl(profile.instagram_url || "");
      setFacebookUrl(profile.facebook_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setHouzzUrl(profile.houzz_url || "");
      setBusinessType(profile.business_type || "general_contractor");
      setHasOffice(profile.has_office || false);
      setOfficeAddress(profile.office_address || "");
      setOfficeStaffCount(profile.office_staff_count?.toString() || "");
      setPmCount(profile.project_manager_count?.toString() || "");
      setEstimatorCount((profile as any).estimator_count?.toString() || "");
      setHasDesigner(profile.has_in_house_designer || false);
      setDesignerCount(profile.designer_count?.toString() || "");
      setHasEstimator(profile.has_dedicated_estimator || false);
      setLeadForemanCount(profile.lead_foreman_count?.toString() || "");
      setWorkType(profile.work_type || "mix");
      setUsesSubs(profile.uses_subcontractors || false);
      setSubTrades(profile.subcontracted_trades || []);
      setIsBonded(profile.is_bonded || false);
      setOperatingDays((profile as any).operating_days || "mon_fri");
      setOperatingStart((profile as any).operating_hours_start || "08:00");
      setOperatingEnd((profile as any).operating_hours_end || "17:00");
      setBidTurnaround((profile as any).bid_turnaround || "");
      setConcurrentProjects((profile as any).concurrent_projects?.toString() || "");
      setProjectTypes(profile.project_types || []);
      setTypicalBudget(profile.typical_budget_range || "");
      setAvgProjectsPerYear(profile.avg_projects_per_year?.toString() || "");
      setTypicalDuration(profile.typical_project_duration || "");
      setLargestProjectValue((profile as any).largest_project_value?.toString() || "");
      setLargestProjectDuration((profile as any).largest_project_duration || "");
      setServiceZips((profile.service_zip_codes || []).join(", "));
      setServiceCounties((profile.service_counties || []).join(", "));
      setServiceCities((profile.service_areas || []).join(", "));
      setLicenseNumber(profile.license_number || "");
      setLicenseExpiration((profile as any).license_expiration || "");
      setWorkersComp(profile.workers_comp_verified || false);
      setCrewSize(profile.crew_size?.toString() || "");
    }
  }, [profile]);

  const handleFileUpload = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("contractor-documents")
      .upload(`${contractorId}/${path}/${file.name}`, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("contractor-documents")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const saveCompanyInfo = async () => {
    await updateOnboarding.mutateAsync({
      company_address: companyAddress,
      years_in_business: parseInt(yearsInBusiness) || null,
      crew_size: parseInt(crewSize) || null,
    } as any);
    await updateProfile.mutateAsync({
      business_phone: businessPhone,
      business_email: businessEmail,
      website,
      contact_name: contactName,
      contact_role: contactRole,
      google_business_url: googleBusinessUrl,
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      linkedin_url: linkedinUrl,
      houzz_url: houzzUrl,
      crew_size: parseInt(crewSize) || null,
    } as any);
    setStep(1);
  };

  const saveOperations = async () => {
    await updateProfile.mutateAsync({
      business_type: businessType,
      has_office: hasOffice,
      office_address: hasOffice ? officeAddress : null,
      office_staff_count: parseInt(officeStaffCount) || 0,
      project_manager_count: parseInt(pmCount) || 0,
      estimator_count: parseInt(estimatorCount) || 0,
      has_in_house_designer: hasDesigner,
      designer_count: hasDesigner ? parseInt(designerCount) || 0 : 0,
      has_dedicated_estimator: hasEstimator,
      lead_foreman_count: parseInt(leadForemanCount) || 0,
      work_type: workType,
      uses_subcontractors: usesSubs,
      subcontracted_trades: usesSubs ? subTrades : [],
      is_bonded: isBonded,
      operating_days: operatingDays,
      operating_hours_start: operatingStart,
      operating_hours_end: operatingEnd,
      bid_turnaround: bidTurnaround,
      concurrent_projects: parseInt(concurrentProjects) || null,
    } as any);
    setStep(2);
  };

  const saveTradesExperience = async () => {
    await updateOnboarding.mutateAsync({ trades: selectedTrades } as any);
    await updateProfile.mutateAsync({
      project_types: projectTypes,
      typical_budget_range: typicalBudget,
      avg_projects_per_year: parseInt(avgProjectsPerYear) || null,
      typical_project_duration: typicalDuration,
      largest_project_value: parseFloat(largestProjectValue) || null,
      largest_project_duration: largestProjectDuration || null,
    } as any);
    setStep(3);
  };

  const saveServiceArea = async () => {
    const zips = serviceZips.split(",").map(s => s.trim()).filter(Boolean);
    const counties = serviceCounties.split(",").map(s => s.trim()).filter(Boolean);
    const cities = serviceCities.split(",").map(s => s.trim()).filter(Boolean);
    await updateProfile.mutateAsync({
      service_zip_codes: zips,
      service_counties: counties,
      service_areas: cities,
    } as any);
    setStep(4);
  };

  const saveLicensing = async () => {
    await updateProfile.mutateAsync({
      license_number: licenseNumber,
      license_expiration: licenseExpiration,
      workers_comp_verified: workersComp,
    } as any);
    setStep(5);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "license" | "insurance" | "w9" | "contract_sample" | "estimate_sample") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await handleFileUpload(file, docType);
      if (docType === "contract_sample" || docType === "estimate_sample") {
        await updateProfile.mutateAsync({
          [docType === "contract_sample" ? "contract_sample_url" : "estimate_sample_url"]: url,
        } as any);
      } else {
        const updates: any = {};
        if (docType === "license") { updates.license_document_url = url; updates.license_verified = true; }
        else if (docType === "insurance") { updates.insurance_document_url = url; updates.insurance_verified = true; }
        else { updates.w9_url = url; }
        await updateOnboarding.mutateAsync(updates);
      }
      toast({ title: "Uploaded", description: `${docType.replace("_", " ")} uploaded successfully.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const parseCostCodeCSV = async () => {
    if (!costCodeFile) return;
    setParsingCodes(true);
    try {
      const text = await costCodeFile.text();
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });
      setParsedCodes(rows);
      toast({ title: "Parsed", description: `${rows.length} cost codes found.` });
    } catch (err: any) {
      toast({ title: "Parse error", description: err.message, variant: "destructive" });
    } finally {
      setParsingCodes(false);
    }
  };

  const saveCostCodes = useMutation({
    mutationFn: async () => {
      if (!contractorId || parsedCodes.length === 0) return;
      const records = parsedCodes.map(row => ({
        contractor_id: contractorId,
        code: row.cost_code || row.code || "",
        description: row.description || "",
        unit: (row.unit || "EA").toUpperCase(),
        labor_rate: parseFloat(row.labor_rate) || 0,
        material_rate: parseFloat(row.material_rate) || 0,
        total_unit_price: parseFloat(row.total_unit_price) || 0,
      }));
      const { error } = await supabase.from("cost_codes").insert(records);
      if (error) throw error;
      await updateOnboarding.mutateAsync({ pricing_template_created: true } as any);
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Cost codes imported." });
      queryClient.invalidateQueries({ queryKey: ["cost-codes"] });
      setStep(7);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const uploadPortfolio = async () => {
    if (!contractorId || portfolioFiles.length === 0) return;
    setUploadingPortfolio(true);
    try {
      for (const file of portfolioFiles) {
        const url = await handleFileUpload(file, "portfolio");
        await supabase.from("contractor_portfolio_images").insert({
          contractor_id: contractorId,
          image_url: url,
          caption: file.name,
        });
      }
      await updateOnboarding.mutateAsync({ portfolio_uploaded: true } as any);
      toast({ title: "Uploaded", description: `${portfolioFiles.length} images added.` });
      setStep(8);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const acceptTosAndSubmit = async () => {
    await updateProfile.mutateAsync({
      tos_accepted_at: new Date().toISOString(),
      tos_version: "1.0",
      approval_status: "pending",
    } as any);
    await updateOnboarding.mutateAsync({ onboarding_status: "pending_review" } as any);
    toast({ title: "Submitted!", description: "Your profile is under review." });
  };

  const isLoading = onbLoading || profLoading;
  const completionPct = profile?.profile_completion_pct || 0;

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ContractorLayout>
    );
  }

  if (onboarding?.onboarding_status === "pending_review") {
    return (
      <ContractorLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-accent mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Application Under Review</h1>
          <p className="text-muted-foreground">Your profile has been submitted for review. We'll notify you once approved.</p>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground">Finish setup to start bidding on projects.</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={completionPct} className="flex-1" />
            <span className="text-sm font-medium text-foreground">{completionPct}%</span>
          </div>
          {completionPct < 80 && (
            <p className="text-xs text-muted-foreground mt-1">Reach 80% to unlock bidding</p>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                i === step ? "bg-accent text-accent-foreground" : i < step ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>

        {/* Step 0: Company Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Contact details and online presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main Point of Contact</Label>
                  <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Role</Label>
                  <Select value={contactRole} onValueChange={setContactRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="office_manager">Office Manager</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="estimator">Estimator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company Address</Label>
                <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Main St, City, NJ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years in Business</Label>
                  <Input type="number" value={yearsInBusiness} onChange={e => setYearsInBusiness(e.target.value)} placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label>Crew Size</Label>
                  <Input type="number" value={crewSize} onChange={e => setCrewSize(e.target.value)} placeholder="5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Phone</Label>
                  <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Business Email</Label>
                  <Input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="info@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Globe className="h-4 w-4" /> Online Presence</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Google Business</Label>
                    <Input value={googleBusinessUrl} onChange={e => setGoogleBusinessUrl(e.target.value)} placeholder="Google Business URL" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Instagram</Label>
                    <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="Instagram URL" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Facebook</Label>
                    <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="Facebook URL" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LinkedIn</Label>
                    <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Houzz</Label>
                    <Input value={houzzUrl} onChange={e => setHouzzUrl(e.target.value)} placeholder="Houzz URL" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveCompanyInfo} disabled={updateOnboarding.isPending || updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {(updateOnboarding.isPending || updateProfile.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Operations */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Operations</CardTitle>
              <CardDescription>Team structure, workforce, and operating details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_contractor">General Contractor</SelectItem>
                    <SelectItem value="design_build">Design-Build Firm</SelectItem>
                    <SelectItem value="specialty_contractor">Specialty Contractor</SelectItem>
                    <SelectItem value="trade_contractor">Trade Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Brick & Mortar Office?</Label>
                <Switch checked={hasOffice} onCheckedChange={setHasOffice} />
              </div>
              {hasOffice && (
                <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                  <Label>Office Address</Label>
                  <Input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Office address" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Office Staff</Label>
                  <Input type="number" value={officeStaffCount} onChange={e => setOfficeStaffCount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Project Managers</Label>
                  <Input type="number" value={pmCount} onChange={e => setPmCount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Estimators</Label>
                  <Input type="number" value={estimatorCount} onChange={e => setEstimatorCount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>In-House Designers?</Label>
                <Switch checked={hasDesigner} onCheckedChange={setHasDesigner} />
              </div>
              {hasDesigner && (
                <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                  <Label>Designer Count</Label>
                  <Input type="number" value={designerCount} onChange={e => setDesignerCount(e.target.value)} placeholder="1" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead Foreman Count</Label>
                  <Input type="number" value={leadForemanCount} onChange={e => setLeadForemanCount(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Concurrent Projects</Label>
                  <Input type="number" value={concurrentProjects} onChange={e => setConcurrentProjects(e.target.value)} placeholder="3" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Type</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_house">Mostly In-House</SelectItem>
                    <SelectItem value="mix">Mix of In-House + Subs</SelectItem>
                    <SelectItem value="subcontracted">Mostly Subcontracted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Do you subcontract work?</Label>
                <Switch checked={usesSubs} onCheckedChange={setUsesSubs} />
              </div>
              {usesSubs && (
                <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                  <Label className="text-sm">Subcontracted Trades</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUB_TRADES.map(t => (
                      <label key={t} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={subTrades.includes(t)}
                          onCheckedChange={(c) => setSubTrades(prev => c ? [...prev, t] : prev.filter(x => x !== t))}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Bonded?</Label>
                <Switch checked={isBonded} onCheckedChange={setIsBonded} />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Operating Hours & Responsiveness</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Days of Operation</Label>
                    <Select value={operatingDays} onValueChange={setOperatingDays}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mon_fri">Mon–Fri</SelectItem>
                        <SelectItem value="mon_sat">Mon–Sat</SelectItem>
                        <SelectItem value="7_days">7 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={operatingStart} onChange={e => setOperatingStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={operatingEnd} onChange={e => setOperatingEnd(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Average Bid Turnaround</Label>
                  <Select value={bidTurnaround} onValueChange={setBidTurnaround}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24-48 hours">24–48 hours</SelectItem>
                      <SelectItem value="3-5 days">3–5 days</SelectItem>
                      <SelectItem value="5-7 days">5–7 days</SelectItem>
                      <SelectItem value="7-10 days">7–10 days</SelectItem>
                      <SelectItem value="10+ days">10+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={saveOperations} disabled={updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Trades & Experience */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Trades & Project Experience</CardTitle>
              <CardDescription>Select your trade specialties and experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-2 block">Trade Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {TRADES.map(trade => (
                    <Badge
                      key={trade}
                      variant={selectedTrades.includes(trade) ? "default" : "outline"}
                      className={cn("cursor-pointer text-sm py-2 px-3", selectedTrades.includes(trade) ? "bg-accent text-accent-foreground" : "hover:bg-accent/10")}
                      onClick={() => setSelectedTrades(prev => prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade])}
                    >
                      {trade}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Project Experience</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map(pt => (
                    <label key={pt} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={projectTypes.includes(pt)}
                        onCheckedChange={(c) => setProjectTypes(prev => c ? [...prev, pt] : prev.filter(x => x !== pt))}
                      />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Average Project Size</Label>
                <Select value={typicalBudget} onValueChange={setTypicalBudget}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$10k – $50k">$10k – $50k</SelectItem>
                    <SelectItem value="$50k – $100k">$50k – $100k</SelectItem>
                    <SelectItem value="$100k – $250k">$100k – $250k</SelectItem>
                    <SelectItem value="$250k – $500k">$250k – $500k</SelectItem>
                    <SelectItem value="$500k+">$500k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Average Projects/Year</Label>
                  <Input type="number" value={avgProjectsPerYear} onChange={e => setAvgProjectsPerYear(e.target.value)} placeholder="15" />
                </div>
                <div className="space-y-2">
                  <Label>Typical Duration</Label>
                  <Select value={typicalDuration} onValueChange={setTypicalDuration}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2 weeks">1–2 weeks</SelectItem>
                      <SelectItem value="3-4 weeks">3–4 weeks</SelectItem>
                      <SelectItem value="1-3 months">1–3 months</SelectItem>
                      <SelectItem value="3-6 months">3–6 months</SelectItem>
                      <SelectItem value="6+ months">6+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-foreground mb-3">Largest Project Completed</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Value ($)</Label>
                    <Input type="number" value={largestProjectValue} onChange={e => setLargestProjectValue(e.target.value)} placeholder="500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={largestProjectDuration} onValueChange={setLargestProjectDuration}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3 months">1–3 months</SelectItem>
                        <SelectItem value="3-6 months">3–6 months</SelectItem>
                        <SelectItem value="6-12 months">6–12 months</SelectItem>
                        <SelectItem value="12+ months">12+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={saveTradesExperience} disabled={selectedTrades.length === 0 || updateOnboarding.isPending || updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Service Area */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>Define where you work. Used for Smart Match project scoring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cities (comma-separated)</Label>
                <Textarea value={serviceCities} onChange={e => setServiceCities(e.target.value)} placeholder="Ridgewood, Paramus, Wyckoff" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>ZIP Codes (comma-separated)</Label>
                <Textarea value={serviceZips} onChange={e => setServiceZips(e.target.value)} placeholder="07450, 07652, 07481" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Counties (comma-separated)</Label>
                <Textarea value={serviceCounties} onChange={e => setServiceCounties(e.target.value)} placeholder="Bergen, Passaic" rows={2} />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={saveServiceArea} disabled={updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Licensing & Insurance */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Licensing & Insurance</CardTitle>
              <CardDescription>License details and document uploads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="13VH12345678" />
                </div>
                <div className="space-y-2">
                  <Label>License Expiration</Label>
                  <Input type="date" value={licenseExpiration} onChange={e => setLicenseExpiration(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Workers Compensation Coverage?</Label>
                <Switch checked={workersComp} onCheckedChange={setWorkersComp} />
              </div>

              {[
                { label: "Contractor License", type: "license" as const, done: onboarding?.license_verified },
                { label: "General Liability Insurance", type: "insurance" as const, done: onboarding?.insurance_verified },
                { label: "W9 Form", type: "w9" as const, done: !!onboarding?.w9_url },
              ].map(doc => (
                <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {doc.done ? <CheckCircle className="h-5 w-5 text-accent" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-foreground">{doc.label}</p>
                      <p className="text-sm text-muted-foreground">{doc.done ? "Uploaded" : "Required"}</p>
                    </div>
                  </div>
                  <Input type="file" accept=".pdf,.jpg,.png" className="w-48" onChange={e => handleDocUpload(e, doc.type)} disabled={uploading} />
                </div>
              ))}

              {workersComp && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Workers Comp Certificate</p>
                      <p className="text-sm text-muted-foreground">Upload if applicable</p>
                    </div>
                  </div>
                  <Input type="file" accept=".pdf,.jpg,.png" className="w-48" onChange={e => handleDocUpload(e, "insurance")} disabled={uploading} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Expiry</Label>
                  <Input type="date" onChange={e => updateOnboarding.mutate({ license_expiry: e.target.value } as any)} defaultValue={onboarding?.license_expiry || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Expiry</Label>
                  <Input type="date" onChange={e => updateOnboarding.mutate({ insurance_expiry: e.target.value } as any)} defaultValue={onboarding?.insurance_expiry || ""} />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={saveLicensing} disabled={updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Documents & Samples */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Documents & Samples</CardTitle>
              <CardDescription>Upload your contract and estimate samples for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {(profile as any)?.contract_sample_url ? <CheckCircle className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-foreground">Home Improvement Contract Sample</p>
                    <p className="text-sm text-muted-foreground">Upload a sample of the contract you use with homeowners</p>
                  </div>
                </div>
                <Input type="file" accept=".pdf,.doc,.docx" className="w-48" onChange={e => handleDocUpload(e, "contract_sample")} disabled={uploading} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {(profile as any)?.estimate_sample_url ? <CheckCircle className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-foreground">Previous Estimate Sample</p>
                    <p className="text-sm text-muted-foreground">Upload a sample estimate to show your estimating style</p>
                  </div>
                </div>
                <Input type="file" accept=".pdf,.doc,.docx,.xlsx" className="w-48" onChange={e => handleDocUpload(e, "estimate_sample")} disabled={uploading} />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(6)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Cost Codes */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Cost Codes</CardTitle>
              <CardDescription>Upload your pricing library (CSV).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Input type="file" accept=".csv" onChange={e => setCostCodeFile(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
              </div>
              {costCodeFile && parsedCodes.length === 0 && (
                <Button onClick={parseCostCodeCSV} disabled={parsingCodes} variant="outline" className="w-full">
                  {parsingCodes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Parse File
                </Button>
              )}
              {parsedCodes.length > 0 && (
                <div className="border rounded-lg overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left text-foreground">Code</th>
                        <th className="p-2 text-left text-foreground">Description</th>
                        <th className="p-2 text-left text-foreground">Unit</th>
                        <th className="p-2 text-right text-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCodes.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-foreground">{row.cost_code || row.code}</td>
                          <td className="p-2 text-foreground">{row.description}</td>
                          <td className="p-2 text-foreground">{row.unit}</td>
                          <td className="p-2 text-right text-foreground">${row.total_unit_price || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(5)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(7)}>Skip</Button>
                  <Button onClick={() => saveCostCodes.mutate()} disabled={parsedCodes.length === 0 || saveCostCodes.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {saveCostCodes.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Import & Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Portfolio */}
        {step === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Images</CardTitle>
              <CardDescription>Showcase your past work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Input type="file" accept="image/*" multiple onChange={e => setPortfolioFiles(Array.from(e.target.files || []))} className="max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">{portfolioFiles.length} files selected</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(6)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(8)}>Skip</Button>
                  <Button onClick={uploadPortfolio} disabled={portfolioFiles.length === 0 || uploadingPortfolio} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {uploadingPortfolio ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Upload & Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 8: Terms of Service */}
        {step === 8 && (
          <ContractorTermsOfService
            onAccept={acceptTosAndSubmit}
            onBack={() => setStep(7)}
            isPending={updateOnboarding.isPending || updateProfile.isPending}
          />
        )}

        {/* Step 9: Submit / Review Checklist */}
        {step === 9 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Review your information before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Company Info", done: !!companyAddress || !!businessPhone },
                  { label: "Operations", done: !!businessType },
                  { label: "Trades Selected", done: (onboarding?.trades?.length || 0) > 0 },
                  { label: "Service Area", done: (profile?.service_areas?.length || 0) > 0 || (profile?.service_zip_codes?.length || 0) > 0 },
                  { label: "License & Insurance", done: onboarding?.license_verified && onboarding?.insurance_verified },
                  { label: "Documents", done: !!(profile as any)?.contract_sample_url },
                  { label: "Cost Codes", done: onboarding?.pricing_template_created },
                  { label: "Portfolio", done: onboarding?.portfolio_uploaded },
                  { label: "Terms Accepted", done: !!(profile as any)?.tos_accepted_at },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {item.done ? <CheckCircle className="h-5 w-5 text-accent" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                    <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(8)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={acceptTosAndSubmit} disabled={updateOnboarding.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
                  {updateOnboarding.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ContractorLayout>
  );
}
