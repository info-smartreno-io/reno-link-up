import { useState } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContractorOnboarding, useContractorId } from "@/hooks/contractor/useContractorOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Building2, Wrench, Upload, FileSpreadsheet, Image, Send,
  CheckCircle, ChevronRight, ChevronLeft, Loader2
} from "lucide-react";

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Trades", icon: Wrench },
  { label: "Uploads", icon: Upload },
  { label: "Cost Codes", icon: FileSpreadsheet },
  { label: "Portfolio", icon: Image },
  { label: "Submit", icon: Send },
];

const TRADES = [
  "General Contractor", "Kitchen", "Bathroom", "Basement", "Additions",
  "Roofing", "Electrical", "Plumbing", "HVAC", "Flooring", "Painting", "Landscaping",
];

export default function ContractorOnboardingWizard() {
  const [step, setStep] = useState(0);
  const { data: onboarding, isLoading, updateOnboarding } = useContractorOnboarding();
  const { data: contractorId } = useContractorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step 1: Company Info
  const [companyAddress, setCompanyAddress] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [crewSize, setCrewSize] = useState("");

  // Step 2: Trades
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);

  // Step 3: Uploads
  const [uploading, setUploading] = useState(false);

  // Step 4: Cost codes
  const [costCodeFile, setCostCodeFile] = useState<File | null>(null);
  const [parsedCodes, setParsedCodes] = useState<any[]>([]);
  const [parsingCodes, setParsingCodes] = useState(false);

  // Step 5: Portfolio
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  // Initialize from existing data
  useState(() => {
    if (onboarding) {
      setCompanyAddress(onboarding.company_address || "");
      setYearsInBusiness(onboarding.years_in_business?.toString() || "");
      setCrewSize(onboarding.crew_size?.toString() || "");
      setSelectedTrades(onboarding.trades || []);
    }
  });

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
    setStep(1);
  };

  const saveTrades = async () => {
    await updateOnboarding.mutateAsync({ trades: selectedTrades } as any);
    setStep(2);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "license" | "insurance" | "w9") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await handleFileUpload(file, docType);
      const updates: any = {};
      if (docType === "license") {
        updates.license_document_url = url;
        updates.license_verified = true;
      } else if (docType === "insurance") {
        updates.insurance_document_url = url;
        updates.insurance_verified = true;
      } else {
        updates.w9_url = url;
      }
      await updateOnboarding.mutateAsync(updates);
      toast({ title: "Uploaded", description: `${docType} uploaded successfully.` });
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
      setStep(4);
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
      setStep(5);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const submitForReview = async () => {
    await updateOnboarding.mutateAsync({ onboarding_status: "pending_review" } as any);
    toast({ title: "Submitted!", description: "Your profile is under review. We'll notify you once approved." });
  };

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
          <p className="text-muted-foreground">Your profile has been submitted for review. We'll notify you once you're approved to start bidding on projects.</p>
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

        {/* Step 1: Company Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Tell us about your business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Company Address</Label>
                <Input id="address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Main St, City, NJ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years">Years in Business</Label>
                  <Input id="years" type="number" value={yearsInBusiness} onChange={e => setYearsInBusiness(e.target.value)} placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crew">Crew Size</Label>
                  <Input id="crew" type="number" value={crewSize} onChange={e => setCrewSize(e.target.value)} placeholder="5" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveCompanyInfo} disabled={updateOnboarding.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {updateOnboarding.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Trades */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Trades</CardTitle>
              <CardDescription>Choose all trades your company services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {TRADES.map(trade => (
                  <Badge
                    key={trade}
                    variant={selectedTrades.includes(trade) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-sm py-2 px-3 transition-colors",
                      selectedTrades.includes(trade) ? "bg-accent text-accent-foreground" : "hover:bg-accent/10"
                    )}
                    onClick={() => setSelectedTrades(prev =>
                      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
                    )}
                  >
                    {trade}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={saveTrades} disabled={selectedTrades.length === 0 || updateOnboarding.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Uploads */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>License, Insurance, and W9 are required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Contractor License", type: "license" as const, done: onboarding?.license_verified },
                { label: "Insurance Certificate", type: "insurance" as const, done: onboarding?.insurance_verified },
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
                  <div>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.png"
                      className="w-48"
                      onChange={e => handleDocUpload(e, doc.type)}
                      disabled={uploading}
                    />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Expiry</Label>
                  <Input type="date" onChange={e => updateOnboarding.mutate({ license_expiry: e.target.value } as any)} />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Expiry</Label>
                  <Input type="date" onChange={e => updateOnboarding.mutate({ insurance_expiry: e.target.value } as any)} />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(3)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Cost Codes */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Cost Codes</CardTitle>
              <CardDescription>Upload your pricing library (CSV). Columns: Cost Code, Description, Unit, Labor Rate, Material Rate, Total Unit Price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Input
                  type="file"
                  accept=".csv"
                  onChange={e => setCostCodeFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-2">Accepted: CSV</p>
              </div>

              {costCodeFile && parsedCodes.length === 0 && (
                <Button onClick={parseCostCodeCSV} disabled={parsingCodes} variant="outline" className="w-full">
                  {parsingCodes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Parse File
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
                        <th className="p-2 text-right text-foreground">Labor</th>
                        <th className="p-2 text-right text-foreground">Material</th>
                        <th className="p-2 text-right text-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCodes.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-foreground">{row.cost_code || row.code}</td>
                          <td className="p-2 text-foreground">{row.description}</td>
                          <td className="p-2 text-foreground">{row.unit}</td>
                          <td className="p-2 text-right text-foreground">${row.labor_rate || "0"}</td>
                          <td className="p-2 text-right text-foreground">${row.material_rate || "0"}</td>
                          <td className="p-2 text-right text-foreground">${row.total_unit_price || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedCodes.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-2">...and {parsedCodes.length - 10} more</p>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(4)}>Skip</Button>
                  <Button
                    onClick={() => saveCostCodes.mutate()}
                    disabled={parsedCodes.length === 0 || saveCostCodes.isPending}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {saveCostCodes.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Import & Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Portfolio */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Images</CardTitle>
              <CardDescription>Upload photos of past projects to showcase your work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setPortfolioFiles(Array.from(e.target.files || []))}
                  className="max-w-xs mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-2">{portfolioFiles.length} files selected</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(5)}>Skip</Button>
                  <Button
                    onClick={uploadPortfolio}
                    disabled={portfolioFiles.length === 0 || uploadingPortfolio}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {uploadingPortfolio ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Upload & Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Submit */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Submit for Review</CardTitle>
              <CardDescription>Review your information and submit your profile for approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Company Info", done: !!onboarding?.company_address },
                  { label: "Trades Selected", done: (onboarding?.trades?.length || 0) > 0 },
                  { label: "License Uploaded", done: onboarding?.license_verified },
                  { label: "Insurance Uploaded", done: onboarding?.insurance_verified },
                  { label: "Cost Codes", done: onboarding?.pricing_template_created },
                  { label: "Portfolio", done: onboarding?.portfolio_uploaded },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {item.done
                      ? <CheckCircle className="h-5 w-5 text-accent" />
                      : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    }
                    <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button
                  onClick={submitForReview}
                  disabled={updateOnboarding.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  size="lg"
                >
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
