import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const formSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string()
    .trim()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" }),
  portfolio_url: z.string()
    .trim()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
  website_url: z.string()
    .trim()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
  linkedin_url: z.string()
    .trim()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
  years_experience: z.coerce.number()
    .min(0, { message: "Must be 0 or greater" })
    .max(50, { message: "Must be 50 or less" }),
  specializations: z.array(z.string()).min(1, { message: "Select at least one specialization" }),
  service_areas: z.array(z.string()).min(1, { message: "Select at least one service area" }),
  certifications: z.array(z.string()),
  design_software: z.array(z.string()),
  project_types: z.array(z.string()).min(1, { message: "Select at least one project type" }),
  why_join: z.string()
    .trim()
    .min(50, { message: "Please provide at least 50 characters" })
    .max(1000, { message: "Must be less than 1000 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const SPECIALIZATIONS = [
  "Residential Design",
  "Commercial Design",
  "Hospitality Design",
  "Healthcare Design",
  "Sustainable/Green Design",
  "Kitchen & Bath",
  "Color Consulting",
  "Space Planning",
  "Furniture Design",
  "Lighting Design",
];

const SERVICE_AREAS = [
  "Bergen County",
  "Essex County",
  "Hudson County",
  "Morris County",
  "Passaic County",
  "Union County",
  "Somerset County",
];

const PROJECT_TYPES = [
  "Kitchen Remodels",
  "Bathroom Remodels",
  "Whole Home Renovations",
  "Room Additions",
  "Basement Finishing",
  "Commercial Spaces",
  "New Construction",
];

const CERTIFICATIONS = [
  "NCIDQ Certified",
  "LEED AP",
  "ASID Member",
  "IIDA Member",
  "Allied ASID",
  "NKBA Certified",
];

const DESIGN_SOFTWARE = [
  "AutoCAD",
  "SketchUp",
  "Revit",
  "Chief Architect",
  "3ds Max",
  "Rhino",
  "Photoshop",
  "Illustrator",
  "InDesign",
];

export default function InteriorDesignerApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      portfolio_url: "",
      website_url: "",
      linkedin_url: "",
      years_experience: 0,
      specializations: [],
      service_areas: [],
      certifications: [],
      design_software: [],
      project_types: [],
      why_join: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("interior_designer_applications")
        .insert({
          name: values.name,
          email: values.email,
          phone: values.phone,
          portfolio_url: values.portfolio_url || null,
          website_url: values.website_url || null,
          linkedin_url: values.linkedin_url || null,
          years_experience: values.years_experience,
          specializations: values.specializations,
          service_areas: values.service_areas,
          certifications: values.certifications,
          design_software: values.design_software,
          project_types: values.project_types,
          why_join: values.why_join,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification to admin
      try {
        await supabase.functions.invoke("send-designer-application-notification", {
          body: {
            type: "new_application",
            designerName: values.name,
            designerEmail: values.email,
            applicationData: {
              yearsExperience: values.years_experience,
              specializations: values.specializations,
              serviceAreas: values.service_areas,
              portfolioUrl: values.portfolio_url || undefined,
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the whole process if email fails
      }

      toast({
        title: "Application Submitted!",
        description: "Now let's create your account password.",
      });

      // Redirect to password creation with email and name
      navigate(`/create-password?email=${encodeURIComponent(values.email)}&name=${encodeURIComponent(values.name)}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/interiordesigners" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Interior Designers
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Interior Designer Application</CardTitle>
            <CardDescription>
              Join our network of talented interior designers and access exclusive renovation projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Professional Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Links</h3>

                  <FormField
                    control={form.control}
                    name="portfolio_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://myportfolio.com" {...field} />
                        </FormControl>
                        <FormDescription>Link to your online portfolio</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://mywebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://linkedin.com/in/yourprofile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Experience</h3>

                  <FormField
                    control={form.control}
                    name="years_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience *</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specializations"
                    render={() => (
                      <FormItem>
                        <FormLabel>Specializations * (select all that apply)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SPECIALIZATIONS.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="specializations"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, item]
                                          : field.value?.filter((value) => value !== item);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifications"
                    render={() => (
                      <FormItem>
                        <FormLabel>Certifications (select all that apply)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {CERTIFICATIONS.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="certifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, item]
                                          : field.value?.filter((value) => value !== item);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="design_software"
                    render={() => (
                      <FormItem>
                        <FormLabel>Design Software Proficiency (select all that apply)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {DESIGN_SOFTWARE.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="design_software"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, item]
                                          : field.value?.filter((value) => value !== item);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Information</h3>

                  <FormField
                    control={form.control}
                    name="service_areas"
                    render={() => (
                      <FormItem>
                        <FormLabel>Service Areas * (select all that apply)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SERVICE_AREAS.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="service_areas"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, item]
                                          : field.value?.filter((value) => value !== item);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_types"
                    render={() => (
                      <FormItem>
                        <FormLabel>Project Types * (select all that apply)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {PROJECT_TYPES.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="project_types"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, item]
                                          : field.value?.filter((value) => value !== item);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Why Join */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">About You</h3>

                  <FormField
                    control={form.control}
                    name="why_join"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to join SmartReno? *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your design philosophy, experience, and what makes you a great fit for our network..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0} / 1000 characters (minimum 50)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
