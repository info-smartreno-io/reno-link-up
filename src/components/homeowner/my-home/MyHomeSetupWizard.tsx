import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Home, MapPin, Info, Camera, Settings2, FileText, Sparkles } from "lucide-react";
import { useCreateHomeProfile, useUpdateHomeProfile, useHomeProfile, useGenerateHomeInsights, SYSTEM_TYPES } from "@/hooks/useHomeProfile";
import { useCreateHomeSystem } from "@/hooks/useHomeProfile";
import { toast } from "sonner";

const STEPS = [
  { label: "Address", icon: MapPin },
  { label: "Details", icon: Info },
  { label: "Systems", icon: Settings2 },
  { label: "Review", icon: Sparkles },
];

const HOME_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "cape_cod", label: "Cape Cod" },
  { value: "colonial", label: "Colonial" },
  { value: "ranch", label: "Ranch" },
  { value: "split_level", label: "Split Level" },
  { value: "other", label: "Other" },
];

interface Props {
  onComplete: () => void;
}

export function MyHomeSetupWizard({ onComplete }: Props) {
  const { data: existingProfile } = useHomeProfile();
  const createProfile = useCreateHomeProfile();
  const updateProfile = useUpdateHomeProfile();
  const createSystem = useCreateHomeSystem();
  const generateInsights = useGenerateHomeInsights();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    property_address: existingProfile?.property_address || "",
    address_line_1: existingProfile?.address_line_1 || "",
    city: existingProfile?.city || "",
    state: existingProfile?.state || "",
    zip_code: existingProfile?.zip_code || "",
    year_built: existingProfile?.year_built?.toString() || "",
    square_footage: existingProfile?.square_footage?.toString() || "",
    home_type: existingProfile?.home_type || "",
    bedrooms: existingProfile?.bedrooms?.toString() || "",
    bathrooms: existingProfile?.bathrooms?.toString() || "",
    floors: existingProfile?.floors?.toString() || "",
    heat_fuel_type: existingProfile?.heat_fuel_type || "",
  });

  const [systems, setSystems] = useState<Array<{ system_type: string; install_year: string; condition_rating: string }>>([]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const addSystem = () => setSystems(prev => [...prev, { system_type: "", install_year: "", condition_rating: "" }]);
  const updateSystem = (index: number, key: string, value: string) => {
    setSystems(prev => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
  };
  const removeSystem = (index: number) => setSystems(prev => prev.filter((_, i) => i !== index));

  const canNext = () => {
    if (step === 0) return form.property_address.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    try {
      const profileData = {
        property_address: form.property_address,
        address_line_1: form.address_line_1 || null,
        city: form.city || null,
        state: form.state || null,
        zip_code: form.zip_code || null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        square_footage: form.square_footage ? parseInt(form.square_footage) : null,
        home_type: form.home_type || null,
        bedrooms: form.bedrooms ? parseFloat(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        heat_fuel_type: form.heat_fuel_type || null,
      };

      let profileId: string;
      if (existingProfile) {
        await updateProfile.mutateAsync({ id: existingProfile.id, ...profileData });
        profileId = existingProfile.id;
      } else {
        const result = await createProfile.mutateAsync(profileData);
        profileId = result.id;
      }

      // Create systems
      for (const sys of systems) {
        if (sys.system_type) {
          await createSystem.mutateAsync({
            home_profile_id: profileId,
            system_type: sys.system_type,
            install_year: sys.install_year ? parseInt(sys.install_year) : null,
            condition_rating: sys.condition_rating || null,
          });
        }
      }

      // Generate initial insights if systems were added
      if (systems.filter(s => s.system_type).length > 0) {
        generateInsights.mutate(profileId);
      }

      onComplete();
    } catch (error) {
      console.error("Setup error:", error);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Property Address</h2>
                <p className="text-sm text-muted-foreground">Where is your home located?</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Full Address *</Label>
                  <Input value={form.property_address} onChange={e => set("property_address", e.target.value)} placeholder="123 Main St, City, State 07450" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Street Address</Label><Input value={form.address_line_1} onChange={e => set("address_line_1", e.target.value)} placeholder="123 Main St" /></div>
                  <div><Label>City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Ridgewood" /></div>
                  <div><Label>State</Label><Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="NJ" /></div>
                  <div><Label>ZIP Code</Label><Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} placeholder="07450" /></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Home Details</h2>
                <p className="text-sm text-muted-foreground">Tell us about your home. All fields are optional.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Year Built</Label>
                  <Input type="number" value={form.year_built} onChange={e => set("year_built", e.target.value)} placeholder="1988" />
                </div>
                <div>
                  <Label>Square Footage</Label>
                  <Input type="number" value={form.square_footage} onChange={e => set("square_footage", e.target.value)} placeholder="2400" />
                </div>
                <div>
                  <Label>Home Type</Label>
                  <Select value={form.home_type} onValueChange={v => set("home_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{HOME_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Heating Fuel</Label>
                  <Select value={form.heat_fuel_type} onValueChange={v => set("heat_fuel_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="oil">Oil</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Bedrooms</Label><Input type="number" step="0.5" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="3" /></div>
                <div><Label>Bathrooms</Label><Input type="number" step="0.5" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="2.5" /></div>
                <div><Label>Floors</Label><Input type="number" value={form.floors} onChange={e => set("floors", e.target.value)} placeholder="2" /></div>
              </div>
            </div>
          )}

          {/* Step 2: Systems */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Major Home Systems</h2>
                <p className="text-sm text-muted-foreground">Add the major systems in your home. You can add more later.</p>
              </div>
              {systems.map((sys, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeSystem(i)}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={sys.system_type} onValueChange={v => updateSystem(i, "system_type", v)}>
                      <SelectTrigger><SelectValue placeholder="System type" /></SelectTrigger>
                      <SelectContent>{SYSTEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="Install year" value={sys.install_year} onChange={e => updateSystem(i, "install_year", e.target.value)} />
                    <Select value={sys.condition_rating} onValueChange={v => updateSystem(i, "condition_rating", v)}>
                      <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSystem}><Settings2 className="h-4 w-4 mr-1" /> Add System</Button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Review & Generate Insights</h2>
                <p className="text-sm text-muted-foreground">Review your information. AI insights will be generated from your entries.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Address:</strong> {form.property_address}</p>
                {form.year_built && <p><strong>Year Built:</strong> {form.year_built}</p>}
                {form.square_footage && <p><strong>Sq Ft:</strong> {form.square_footage}</p>}
                {form.home_type && <p><strong>Type:</strong> {HOME_TYPES.find(t => t.value === form.home_type)?.label}</p>}
                {systems.filter(s => s.system_type).length > 0 && (
                  <div>
                    <strong>Systems:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {systems.filter(s => s.system_type).map((s, i) => (
                        <li key={i}>{SYSTEM_TYPES.find(t => t.value === s.system_type)?.label} {s.install_year && `(${s.install_year})`}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="ghost" onClick={() => step === 0 ? onComplete() : setStep(s => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={createProfile.isPending || updateProfile.isPending}>
                <Check className="h-4 w-4 mr-1" /> {existingProfile ? "Update & Generate" : "Create & Generate"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
