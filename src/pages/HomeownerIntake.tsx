import { useState, useEffect } from "react";
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
import { Upload, ArrowRight, ArrowLeft, Home, X } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Auto-populate fields from the most recent project for this homeowner (for convenience)
  useEffect(() => {
    const hydrateFromLastProject = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: lastProject, error } = await supabase
          .from("projects")
          .select(
            "project_name, project_type, description, address, city, zip_code, photos"
          )
          .eq("homeowner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !lastProject) return;

        form1.reset({
          address: (lastProject.address as string) || "",
          city: (lastProject.city as string) || "",
          state: "",
          zipCode: (lastProject.zip_code as string) || "",
        });

        form2.reset({
          projectName: (lastProject.project_name as string) || "",
          projectType: (lastProject.project_type as string) || "",
          description: (lastProject.description as string) || "",
        });

        form3.reset({
          budgetRange: "",
          timelinePreference: "",
        });

        if (lastProject.photos && Array.isArray(lastProject.photos)) {
          setUploadedPhotos(lastProject.photos as string[]);
        }
      } catch (e) {
        console.warn("HomeownerIntake prefill skipped:", e);
      }
    };

    hydrateFromLastProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/project-intake/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("home-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("home-photos")
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos((prev) => [...prev, ...urls]);

      toast({
        title: "Success",
        description: `Uploaded ${urls.length} photo(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload photos. You can still submit your project without photos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (isSubmitting || uploading) return;
    setIsSubmitting(true);
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

      // Create project record
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          homeowner_id: user.id,
          project_name: step2Data.projectName,
          project_type: step2Data.projectType,
          address: step1Data.address,
          city: step1Data.city,
          zip_code: step1Data.zipCode,
          description: step2Data.description,
          photos: uploadedPhotos,
        } as any)
        .select()
        .single();

      if (projectError) throw projectError;

      console.log('Created project:', project.id);

      toast({
        title: "Project submitted",
        description: "Thanks! Our team will review your project details and follow up shortly.",
      });

      navigate("/homeowner/dashboard");

    } catch (error) {
      console.error("Submission error:", error);
      const anyError = error as any;
      const message =
        (anyError && anyError.message) ||
        (typeof anyError === "string"
          ? anyError
          : "Failed to create project");

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/homeowner/dashboard")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to dashboard
                    </Button>
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 2 && (
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
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Show us the space you want to renovate
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    If you don&apos;t have pictures right now, you can always upload them later in
                    your project details.
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Show us the space you want to renovate
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
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${idx + 1}`}
                          className="rounded-lg object-cover w-full h-24"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedPhotos((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={onSubmit} disabled={isSubmitting || uploading}>
                    {isSubmitting ? "Submitting..." : "Submit Project"}
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