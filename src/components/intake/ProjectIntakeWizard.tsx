import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Upload, X, Camera, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PROJECT_TYPES,
  PROJECT_DESCRIPTIONS,
  BUDGET_OPTIONS,
  FINANCING_OPTIONS,
  DESIGN_OPTIONS,
  MATERIAL_OPTIONS,
  PERMIT_OPTIONS,
  SIZE_OPTIONS,
} from "@/data/projectTypeDescriptions";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IntakeFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  accepted_terms: boolean;
  projectType: string;
  address: string;
  city: string;
  zip: string;
  description: string;
  budget: string;
  financing: string;
  design: string;
  materialHelp: string;
  permitExpectation: string;
  projectSize: string;
  photos: File[];
}

const TOTAL_STEPS = 5;

export function ProjectIntakeWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<IntakeFormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    accepted_terms: false,
    projectType: "",
    address: "",
    city: "",
    zip: "",
    description: "",
    budget: "",
    financing: "",
    design: "",
    materialHelp: "",
    permitExpectation: "",
    projectSize: "",
    photos: [],
  });

  const update = useCallback((field: keyof IntakeFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProjectTypeChange = (value: string) => {
    update("projectType", value);
    const suggestion = PROJECT_DESCRIPTIONS[value];
    if (suggestion && !form.description) {
      update("description", suggestion);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    update("photos", [...form.photos, ...files].slice(0, 10));
  };

  const removePhoto = (idx: number) => {
    update("photos", form.photos.filter((_, i) => i !== idx));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return (
          !!form.full_name?.trim() &&
          EMAIL_REGEX.test(form.email?.trim() || "") &&
          !!form.phone?.trim() &&
          (form.password?.length ?? 0) >= MIN_PASSWORD_LENGTH &&
          form.password === form.confirm_password &&
          form.accepted_terms === true
        );
      case 2:
        return !!form.projectType && !!form.address && !!form.city && !!form.zip;
      case 3:
        return !!form.budget;
      case 4:
        return true; // photos optional
      case 5:
        return !!form.description;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!form.accepted_terms) {
      toast.error("Please accept the Terms and Conditions to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      let user = (await supabase.auth.getUser()).data?.user ?? null;

      // Create homeowner account if not logged in
      if (!user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
              role: "homeowner",
            },
            emailRedirectTo: `${window.location.origin}/homeowner/dashboard`,
          },
        });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Account creation failed. Please try again.");
        user = signUpData.user;
      }

      // Persist terms acceptance on the app-level user profile (new and existing homeowners)
      if (user) {
        const termsVersion = "2026-03-homeowner-terms-v1";
        const { error: termsError } = await supabase
          .from("users" as any)
          .update({
            accepted_terms_at: new Date().toISOString(),
            terms_version: termsVersion,
          } as any)
          .eq("id", user.id);
        if (termsError) {
          console.error("Failed to persist terms acceptance:", termsError);
          // Non-fatal: project creation and portal access should still proceed
        }
      }

      // Upload photos if any (now we have user.id)
      let photoUrls: string[] = [];
      if (form.photos.length > 0 && user) {
        for (const photo of form.photos) {
          const filePath = `project-photos/${user.id}/${Date.now()}-${photo.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("project-files")
            .upload(filePath, photo);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage
              .from("project-files")
              .getPublicUrl(filePath);
            photoUrls.push(urlData.publicUrl);
          }
        }
      }

      const projectLabel = PROJECT_TYPES.find(t => t.value === form.projectType)?.label || form.projectType;

      let budgetMin = 0;
      let budgetMax = 0;
      if (form.budget) {
        const parts = form.budget.split(" - ");
        const minPart = parts[0]?.replace(/[^0-9]/g, "") || "0";
        const maxPart = parts[1]?.replace(/[^0-9]/g, "") || minPart;
        budgetMin = parseFloat(minPart) || 0;
        budgetMax = parseFloat(maxPart) || budgetMin;
      }

      // Create project linked to the new/current homeowner (no more anonymous submissions)
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          project_name: projectLabel,
          project_type: form.projectType,
          description: form.description,
          address: form.address,
          city: form.city,
          zip_code: form.zip,
          budget_range_min: budgetMin,
          budget_range_max: budgetMax,
          financing_needed: form.financing || null,
          design_needed: form.design || null,
          material_help: form.materialHelp || null,
          permit_expectation: form.permitExpectation || null,
          project_size: form.projectSize || null,
          photos: photoUrls,
          status: "open",
          homeowner_id: user.id,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Link to contractor_projects / homeowner_projects when pipeline supports it
      if (project) {
        try {
          const { data: cp } = await supabase
            .from("contractor_projects")
            .insert({
              client_name: form.full_name.trim() || projectLabel,
              project_type: form.projectType,
              address: `${form.address}, ${form.city}, NJ ${form.zip}`,
              status: "intake",
              notes: form.description,
            } as any)
            .select("id")
            .single();

          if (cp) {
            await supabase.from("homeowner_projects").insert({
              homeowner_id: user.id,
              project_id: cp.id,
            } as any);
          }
        } catch (linkErr) {
          console.warn("Pipeline link optional:", linkErr);
          // Do not block success; project is created
        }
      }

      try {
        await supabase.functions.invoke("send-estimate-request-notification", {
          body: {
            name: form.full_name.trim() || projectLabel,
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: `${form.address}, ${form.city}, NJ ${form.zip}`,
            project_type: form.projectType,
            message: [
              form.budget ? `Estimated budget: ${form.budget}` : null,
              form.financing ? `Financing: ${form.financing}` : null,
              form.design ? `Design help: ${form.design}` : null,
              form.materialHelp ? `Material help: ${form.materialHelp}` : null,
              form.permitExpectation ? `Permits: ${form.permitExpectation}` : null,
              form.projectSize ? `Project size: ${form.projectSize}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });
      } catch (notificationError) {
        console.error("ProjectIntakeWizard notification error:", notificationError);
      }

      toast.success("Account created! Taking you to your portal…");
      navigate("/homeowner/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Intake submit error:", err);
      toast.error(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pb-16">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6 sm:p-8">
          {/* Step 1: Contact + Account + Terms */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Create your account</h2>
                <p className="text-sm text-muted-foreground">We'll use this to save your project and keep you updated.</p>
              </div>

              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="jane@example.com"
                />
                {form.email && !EMAIL_REGEX.test(form.email.trim()) && (
                  <p className="text-xs text-destructive">Please enter a valid email address.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(201) 555-0123"
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="At least 8 characters"
                />
                {form.password && form.password.length < MIN_PASSWORD_LENGTH && (
                  <p className="text-xs text-destructive">Password must be at least {MIN_PASSWORD_LENGTH} characters.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirm password *</Label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => update("confirm_password", e.target.value)}
                  placeholder="Repeat your password"
                />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="accepted_terms"
                  checked={form.accepted_terms}
                  onCheckedChange={(checked) => update("accepted_terms", checked === true)}
                />
                <label htmlFor="accepted_terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                  I accept the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Terms and Conditions
                  </a>{" "}
                  and agree to be contacted about my project. *
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Project Type + Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Tell us about your project</h2>
                <p className="text-sm text-muted-foreground">Select what you're planning and where.</p>
              </div>

              <div className="space-y-2">
                <Label>What type of project are you planning? *</Label>
                <Select value={form.projectType} onValueChange={handleProjectTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Address *</Label>
                <Input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Ridgewood"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    value={form.zip}
                    onChange={(e) => update("zip", e.target.value)}
                    placeholder="07450"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget + Qualification */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Project Details</h2>
                <p className="text-sm text-muted-foreground">Help us understand your budget and needs.</p>
              </div>

              <div className="space-y-3">
                <Label>Estimated budget for this project *</Label>
                <RadioGroup value={form.budget} onValueChange={(v) => update("budget", v)} className="grid grid-cols-2 gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${form.budget === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Do you need financing?</Label>
                <RadioGroup value={form.financing} onValueChange={(v) => update("financing", v)} className="space-y-2">
                  {FINANCING_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${form.financing === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Do you need help with design or drawings?</Label>
                <RadioGroup value={form.design} onValueChange={(v) => update("design", v)} className="grid grid-cols-2 gap-2">
                  {DESIGN_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${form.design === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Would you like help selecting materials?</Label>
                <RadioGroup value={form.materialHelp} onValueChange={(v) => update("materialHelp", v)} className="flex gap-3">
                  {MATERIAL_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer flex-1 transition-colors ${form.materialHelp === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Do you think permits will be required?</Label>
                <RadioGroup value={form.permitExpectation} onValueChange={(v) => update("permitExpectation", v)} className="grid grid-cols-2 gap-2">
                  {PERMIT_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${form.permitExpectation === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Approximate size of the area being renovated</Label>
                <Select value={form.projectSize} onValueChange={(v) => update("projectSize", v)}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Upload Photos</h2>
                <p className="text-sm text-muted-foreground">Photos help us understand your space and provide better estimates.</p>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Tap to upload or take a photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10 images</p>
                  </div>
                </label>
              </div>

              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStep(5)}
              >
                I can't upload photos right now →
              </Button>
            </div>
          )}

          {/* Step 5: Description + Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Describe Your Project</h2>
                <p className="text-sm text-muted-foreground">Include what space is being renovated, your goals, layout changes, style preferences, and anything important.</p>
              </div>

              <div className="space-y-2">
                <Label>Project Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe your project in detail..."
                  className="min-h-[200px]"
                />
              </div>

              {/* Quick summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="text-foreground font-medium">
                      {PROJECT_TYPES.find(t => t.value === form.projectType)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>{" "}
                    <span className="text-foreground font-medium">
                      {BUDGET_OPTIONS.find(b => b.value === form.budget)?.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="text-foreground font-medium">
                      {form.address}, {form.city}, NJ {form.zip}
                    </span>
                  </div>
                  {form.photos.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Photos:</span>{" "}
                      <span className="text-foreground font-medium">{form.photos.length} uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? "Submitting..." : "Submit Project Request"}
                {!isSubmitting && <CheckCircle className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
