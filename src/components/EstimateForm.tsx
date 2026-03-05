import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { 
  sanitizeString, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeName, 
  sanitizeAddress,
  containsSuspiciousPatterns,
  checkHoneypot
} from "@/utils/sanitization";
import { trackFormSubmission, trackError } from "@/utils/analytics";
import { CreateAccountPrompt } from "@/components/estimate/CreateAccountPrompt";

// Zod validation schema with security best practices
const estimateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .regex(/^[0-9\s()+-]+$/, { message: "Phone number can only contain digits and common phone symbols" }),
  address: z
    .string()
    .trim()
    .min(5, { message: "Address must be at least 5 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),
  projectType: z
    .string()
    .min(1, { message: "Please select a project type" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

export function EstimateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ email: string; name: string; estimateId: string } | null>(null);
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const { toast } = useToast();


  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      projectType: "",
      message: "",
    },
  });

  const onSubmit = async (data: EstimateFormValues) => {
    setIsSubmitting(true);

    try {
      // 1. Check honeypot (bot detection)
      if (!checkHoneypot(honeypot)) {
        trackError('spam_detected', 'Honeypot field filled', 'estimate_form');
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: "Please try again or contact support if the issue persists.",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Sanitize all inputs
      const sanitizedData = {
        name: sanitizeName(data.name),
        email: sanitizeEmail(data.email),
        phone: sanitizePhone(data.phone),
        address: sanitizeAddress(data.address),
        projectType: sanitizeString(data.projectType),
        message: sanitizeString(data.message),
      };

      // 3. Check for suspicious patterns
      const allInputs = Object.values(sanitizedData).join(' ');
      if (containsSuspiciousPatterns(allInputs)) {
        trackError('suspicious_input', 'Potentially malicious content detected', 'estimate_form');
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Your submission contains invalid characters. Please review and try again.",
        });
        setIsSubmitting(false);
        return;
      }

      // 4. Save to database with sanitized data
      const { data: newEstimate, error: dbError } = await supabase
        .from('estimate_requests')
        .insert({
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          address: sanitizedData.address,
          project_type: sanitizedData.projectType,
          message: sanitizedData.message,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        trackError('database_error', dbError.message, 'estimate_form');
        throw new Error('Failed to save estimate request');
      }

      // 7. Track successful submission
      trackFormSubmission('estimate_request', {
        project_type: sanitizedData.projectType,
        has_message: sanitizedData.message.length > 0,
      });

      // Send SMS notification to homeowner
      const { error: smsError } = await supabase.functions.invoke('send-estimate-sms', {
        body: {
          phone: sanitizedData.phone,
          name: sanitizedData.name,
        },
      });

      if (smsError) {
        console.error('SMS error:', smsError);
        trackError('sms_error', smsError.message, 'estimate_form');
        // Don't throw - continue even if SMS fails
      }

      // Send email notification to admin
      const { error: emailError } = await supabase.functions.invoke('send-estimate-request-notification', {
        body: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          address: sanitizedData.address,
          project_type: sanitizedData.projectType,
          message: sanitizedData.message,
        },
      });

      if (emailError) {
        console.error('Email notification error:', emailError);
        // Don't throw - continue even if email fails
      }


      // Reset form
      form.reset();

      toast({
        title: "Request Submitted Successfully! 🎉",
        description: "We'll contact you within 24 hours to schedule your free estimate visit.",
      });

      // Store data and show account creation prompt
      setSubmittedData({
        email: sanitizedData.email,
        name: sanitizedData.name,
        estimateId: newEstimate.id,
      });
      setShowAccountPrompt(true);

      // Reset form
      form.reset();
    } catch (error: any) {
      console.error('Form submission error:', error);
      trackError('form_submission_error', error.message || 'Unknown error', 'estimate_form');
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again or contact us at info@smartreno.io",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Phone Field */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(201) 555-0123"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Project Type Field */}
          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="kitchen">Kitchen Remodel</SelectItem>
                    <SelectItem value="bathroom">Bathroom Renovation</SelectItem>
                    <SelectItem value="basement">Basement Finishing</SelectItem>
                    <SelectItem value="addition">Home Addition</SelectItem>
                    <SelectItem value="flooring">Flooring</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="windows">Windows & Doors</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Field */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St, Bergen County, NJ 07601"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Message Field */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your project, timeline, and any specific requirements..."
                  className="min-h-[120px] resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot field - hidden from users, detects bots */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Request Free Estimate"
          )}
        </Button>

        {/* Security & Privacy Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
          <p>
            <strong className="text-foreground">Your information is secure.</strong> We use industry-standard encryption and never share your data without permission. By submitting, you agree to be contacted about your renovation project.
          </p>
        </div>
      </form>
    </Form>

    {/* Account Creation Dialog */}
    <Dialog open={showAccountPrompt} onOpenChange={setShowAccountPrompt}>
      <DialogContent className="sm:max-w-[500px] p-0">
        {submittedData && (
          <CreateAccountPrompt
            email={submittedData.email}
            name={submittedData.name}
            estimateRequestId={submittedData.estimateId}
          />
        )}
      </DialogContent>
    </Dialog>
  </>
  );
}
