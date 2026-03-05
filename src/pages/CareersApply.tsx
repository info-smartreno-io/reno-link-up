import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiteNavbar } from "@/components/SiteNavbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  linkedinUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  description: z.string().min(50, "Please provide at least 50 characters").max(2000),
  role: z.string().min(1, "Role is required"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function CareersApply() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      description: "",
      role: searchParams.get("role") || "",
    },
  });

  useEffect(() => {
    const role = searchParams.get("role");
    if (role) {
      form.setValue("role", role);
    }
  }, [searchParams, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `${fieldName} must be less than 10MB`,
        variant: "destructive",
      });
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOC, DOCX, JPG, PNG, or WEBP files",
        variant: "destructive",
      });
      return;
    }

    setter(file);
  };

  const uploadToStorage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("applications").upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data, error: urlError } = await supabase.storage
      .from("applications")
      .createSignedUrl(filePath, 3600);

    if (urlError || !data?.signedUrl) {
      console.error("Signed URL error:", urlError);
      return null;
    }

    return data.signedUrl;
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to storage
      const resumeUrl = await uploadToStorage(resumeFile, "resumes");
      const portfolioUrl = portfolioFile ? await uploadToStorage(portfolioFile, "portfolios") : null;

      if (!resumeUrl) {
        throw new Error("Failed to upload resume");
      }

      // Send application via edge function
      const { error } = await supabase.functions.invoke("send-application", {
        body: {
          ...values,
          resumeUrl,
          portfolioUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      form.reset();
      setResumeFile(null);
      setPortfolioFile(null);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or email careers@smartreno.io directly",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const role = form.watch("role");

  return (
    <>
      <Helmet>
        <title>Apply Now — {role || "SmartReno Careers"}</title>
        <meta
          name="description"
          content="Submit your application to join the SmartReno team. Upload your resume and tell us how you can add value from day one."
        />
      </Helmet>

      <main className="min-h-screen bg-background">
        <SiteNavbar />

        <div className="border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/careers">
                <ArrowLeft className="h-4 w-4" /> Back to Careers
              </Link>
            </Button>
          </div>
        </div>

        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Apply for {role || "a Position"}</h1>
              <p className="mt-2 text-muted-foreground">
                We're excited to learn more about you. Fill out the form below and upload your resume to get started.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Application Form</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(201) 555-0100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Resume <span className="text-destructive">*</span>
                        </label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          {resumeFile ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{resumeFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setResumeFile(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload resume (PDF, DOC, DOCX - Max 10MB)
                              </p>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileChange(e, setResumeFile, "Resume")}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Portfolio (Optional)</label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          {portfolioFile ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{portfolioFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPortfolioFile(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload portfolio (PDF, images - Max 10MB)
                              </p>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => handleFileChange(e, setPortfolioFile, "Portfolio")}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How can you add value to SmartReno from day 1?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your experience, skills, and what you'll bring to the team..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our privacy policy. We'll only use your information to
                      review your application.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="py-10 border-t">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
            Questions? Email us at{" "}
            <a className="underline" href="mailto:careers@smartreno.io">
              careers@smartreno.io
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
