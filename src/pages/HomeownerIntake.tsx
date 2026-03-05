import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowRight, ArrowLeft, Home, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PROJECT_TYPES = [
  "Kitchen Remodel",
  "Bathroom Remodel",
  "Basement Finishing",
  "Home Addition",
  "Deck/Patio",
  "Roof Replacement",
  "Siding",
  "Windows/Doors",
  "Full Home Renovation",
  "Other",
];

const BUDGET_RANGES = [
  "Under $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $250,000",
  "$250,000+",
];

const TIMELINE_PREFERENCES = [
  "ASAP",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Planning phase only",
];

const step1Schema = z.object({
  address: z.string().trim().min(5, "Address is required").max(200),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().length(2, "Please enter 2-letter state code"),
  zipCode: z.string().trim().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
});

const step2Schema = z.object({
  projectName: z.string().trim().min(3, "Project name is required").max(100),
  projectType: z.string().min(1, "Please select a project type"),
  description: z.string().trim().min(10, "Please provide more details (at least 10 characters)").max(1000),
});

const step3Schema = z.object({
  budgetRange: z.string().min(1, "Please select a budget range"),
  timelinePreference: z.string().min(1, "Please select a timeline"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function HomeownerIntake() {
  const [step, setStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    projectType?: string;
    rooms?: string[];
    scope?: string[];
    squareFootage?: number;
    needsMechanical?: boolean;
    needsElectrical?: boolean;
    needsPlumbing?: boolean;
    recommendations?: string[];
  } | null>(null);
  
  // Cost Preview State
  const [costPreview, setCostPreview] = useState<{
    lowEstimate: number;
    mediumEstimate: number;
    highEstimate: number;
    explanation: string;
    costDrivers: string[];
    addons: any[];
    timeWindows: string[];
  } | null>(null);
  const [loadingCostPreview, setLoadingCostPreview] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      projectName: "",
      projectType: "",
      description: "",
    },
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      budgetRange: "",
      timelinePreference: "",
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload photos",
          variant: "destructive",
        });
        return;
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('project-intake-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('project-intake-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
      
      toast({
        title: "Success",
        description: `Uploaded ${urls.length} photo(s)`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAiAssist = async () => {
    const description = form2.watch("description");
    
    if (!description || description.trim().length < 10) {
      toast({
        title: "More details needed",
        description: "Please provide more details about your project (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    setAiProcessing(true);
    setAiSuggestions(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-intake', {
        body: {
          description,
          photos: uploadedPhotos,
        }
      });

      if (error) throw error;

      setAiSuggestions(data);
      toast({
        title: "AI Suggestions Ready",
        description: "Review the suggestions and apply them to your form",
      });
    } catch (error) {
      console.error('AI assist error:', error);
      toast({
        title: "AI Assist Error",
        description: error instanceof Error ? error.message : "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiSuggestions) return;

    if (aiSuggestions.projectType) {
      form2.setValue("projectType", aiSuggestions.projectType);
    }

    if (aiSuggestions.scope && aiSuggestions.scope.length > 0) {
      const currentDescription = form2.watch("description");
      const scopeText = "\n\nSuggested scope:\n" + aiSuggestions.scope.map(item => `• ${item}`).join("\n");
      form2.setValue("description", currentDescription + scopeText);
    }

    toast({
      title: "Suggestions Applied",
      description: "You can edit the autofilled fields as needed",
    });
  };

  const handleRefreshCostPreview = async () => {
    setLoadingCostPreview(true);
    try {
      const step1Data = form1.getValues();
      const step2Data = form2.getValues();
      const step3Data = form3.getValues();
      
      const { data, error } = await supabase.functions.invoke('ai-estimate-companion', {
        body: {
          projectType: step2Data.projectType,
          scope: step2Data.description,
          location: step1Data.state,
          squareFootage: aiSuggestions?.squareFootage || 0
        }
      });

      if (error) throw error;

      setCostPreview(data);
      
      toast({
        title: "Cost Preview Updated",
        description: "AI has analyzed your project details",
      });
    } catch (error: any) {
      console.error('Error fetching cost preview:', error);
      toast({
        title: "Preview Unavailable",
        description: error.message || "Could not generate cost preview",
        variant: "destructive",
      });
    } finally {
      setLoadingCostPreview(false);
    }
  };

  const onSubmit = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const step1Data = form1.getValues();
      const step2Data = form2.getValues();
      const step3Data = form3.getValues();

      // Extract budget range values
      const budgetParts = step3Data.budgetRange.split(" - ");
      const budgetMin = budgetParts[0]?.replace(/[^0-9]/g, "") || "0";
      const budgetMax = budgetParts[1]?.replace(/[^0-9]/g, "") || budgetParts[0]?.replace(/[^0-9]/g, "") || "0";

      // Create project record
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          homeowner_id: user.id,
          project_name: step2Data.projectName,
          project_type: step2Data.projectType,
          address: step1Data.address,
          city: step1Data.city,
          state: step1Data.state,
          zip_code: step1Data.zipCode,
          description: step2Data.description,
          budget_range_min: parseFloat(budgetMin),
          budget_range_max: parseFloat(budgetMax),
          timeline_preference: step3Data.timelinePreference,
          workflow_status: 'intake_complete',
          addons: uploadedPhotos.length > 0 ? JSON.stringify(uploadedPhotos) : '[]',
        } as any)
        .select()
        .single();

      if (projectError) throw projectError;

      console.log('Created project:', project.id);

      // Call create-estimate-checkout edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-estimate-checkout',
        {
          body: {
            projectId: project.id,
            homeownerId: user.id,
            estimateFee: 14999, // $149.99 in cents
            addons: [],
          },
        }
      );

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        // Redirect to Stripe checkout
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <Home className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Get Your Free Estimate</h1>
          <p className="text-muted-foreground">Tell us about your renovation project</p>
        </div>

        <Progress value={progress} className="mb-8" />

        <Card>
          <CardHeader>
            <CardTitle>
              Step {step} of 4
            </CardTitle>
            <CardDescription>
              {step === 1 && "Where is your project located?"}
              {step === 2 && "Tell us about your project"}
              {step === 3 && "Budget and timeline"}
              {step === 4 && "Upload photos (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(() => setStep(2))} className="space-y-4">
                  <FormField
                    control={form1.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form1.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Springfield" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form1.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NJ" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form1.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="07001" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Form {...form2}>
                    <form onSubmit={form2.handleSubmit(() => setStep(3))} className="space-y-4">
                      <FormField
                        control={form2.control}
                        name="projectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Kitchen Remodel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form2.control}
                        name="projectType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PROJECT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form2.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your project in detail... (e.g., 'We want to remodel our kitchen with new cabinets, granite countertops, and update the lighting')"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleAiAssist}
                        disabled={aiProcessing}
                      >
                        {aiProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            AI Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Help Me Describe My Project (AI)
                          </>
                        )}
                      </Button>

                      <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit">
                          Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                {/* AI Suggestions Panel */}
                <div>
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        SmartReno AI Suggestions
                      </CardTitle>
                      <CardDescription>
                        AI-powered insights based on your description
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aiProcessing && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}

                      {!aiProcessing && !aiSuggestions && (
                        <Alert>
                          <AlertDescription>
                            Describe your project on the left, then click "Help Me Describe My Project (AI)" to get intelligent suggestions.
                          </AlertDescription>
                        </Alert>
                      )}

                      {!aiProcessing && aiSuggestions && (
                        <div className="space-y-4">
                          {aiSuggestions.projectType && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Suggested Project Type</h4>
                              <p className="text-sm bg-muted px-3 py-2 rounded-md">
                                {aiSuggestions.projectType}
                              </p>
                            </div>
                          )}

                          {aiSuggestions.rooms && aiSuggestions.rooms.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Rooms Involved</h4>
                              <div className="flex flex-wrap gap-2">
                                {aiSuggestions.rooms.map((room, i) => (
                                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {room}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiSuggestions.squareFootage && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Estimated Square Footage</h4>
                              <p className="text-sm bg-muted px-3 py-2 rounded-md">
                                ~{aiSuggestions.squareFootage} sq ft
                              </p>
                            </div>
                          )}

                          {aiSuggestions.scope && aiSuggestions.scope.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Suggested Scope</h4>
                              <ul className="text-sm space-y-1">
                                {aiSuggestions.scope.map((item, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(aiSuggestions.needsMechanical || aiSuggestions.needsElectrical || aiSuggestions.needsPlumbing) && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Detected Work Types</h4>
                              <div className="flex flex-wrap gap-2">
                                {aiSuggestions.needsMechanical && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    Mechanical
                                  </span>
                                )}
                                {aiSuggestions.needsElectrical && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    Electrical
                                  </span>
                                )}
                                {aiSuggestions.needsPlumbing && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Plumbing
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {aiSuggestions.recommendations && aiSuggestions.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {aiSuggestions.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <Button 
                            onClick={applyAiSuggestions}
                            className="w-full"
                            variant="default"
                          >
                            Apply to Form
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {step === 3 && (
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(() => setStep(4))} className="space-y-4">
                  <FormField
                    control={form3.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUDGET_RANGES.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form3.control}
                    name="timelinePreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="When would you like to start?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMELINE_PREFERENCES.map((timeline) => (
                              <SelectItem key={timeline} value={timeline}>
                                {timeline}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {/* Cost Preview Card */}
                {!costPreview && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        SmartReno Cost Preview (AI)
                      </CardTitle>
                      <CardDescription>
                        Get an instant cost range estimate for your project
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleRefreshCostPreview} 
                        disabled={loadingCostPreview}
                        className="w-full"
                      >
                        {loadingCostPreview ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Preview...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get Cost Preview (AI)
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {costPreview && (
                  <Card className="border-primary bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        SmartReno Cost Preview (AI)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-background rounded-lg border">
                          <div className="text-sm text-muted-foreground mb-1">Low</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${costPreview.lowEstimate.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                          <div className="text-sm text-muted-foreground mb-1">Most Likely</div>
                          <div className="text-2xl font-bold text-primary">
                            ${costPreview.mediumEstimate.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-background rounded-lg border">
                          <div className="text-sm text-muted-foreground mb-1">High</div>
                          <div className="text-2xl font-bold text-orange-600">
                            ${costPreview.highEstimate.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">What This Includes:</h4>
                        <p className="text-sm text-muted-foreground">{costPreview.explanation}</p>
                      </div>

                      {costPreview.costDrivers && costPreview.costDrivers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Major Cost Drivers:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {costPreview.costDrivers.map((driver, idx) => (
                              <li key={idx}>• {driver}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Alert>
                        <AlertDescription className="text-xs">
                          This is a SmartReno AI cost preview. Final pricing will be provided by your assigned estimator after the site visit.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefreshCostPreview}
                        disabled={loadingCostPreview}
                        className="w-full"
                      >
                        {loadingCostPreview ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Refresh Preview
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload photos of the space (optional but helpful)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="max-w-xs mx-auto"
                  />
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedPhotos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Upload ${idx + 1}`}
                        className="rounded-lg object-cover w-full h-24"
                      />
                    ))}
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold mb-2">Next: Pay Estimate Fee ($149.99)</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Professional onsite visit</li>
                    <li>✓ Detailed SmartEstimate with AI analysis</li>
                    <li>✓ 3+ contractor bids within 72 hours</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={onSubmit} disabled={processing || uploading}>
                    {processing ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}