import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

interface NewsletterSignupProps {
  source?: string;
  variant?: "default" | "compact";
}

export default function NewsletterSignup({ source = "blog", variant = "default" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast({
        title: "Invalid email",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const validatedEmail = validation.data;
      
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: validatedEmail,
          source,
          status: "active",
        });

      if (error) {
        // Check if email already exists
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
          });
          setIsSubscribed(true);
          return;
        } else {
          throw error;
        }
      }

      // Success - the database trigger will automatically send the welcome email
      setIsSubscribed(true);
      setEmail("");
      toast({
        title: "Successfully subscribed!",
        description: "Check your email for a welcome message.",
      });
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again later or contact us for help.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting || isSubscribed}
          className="flex-1"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || isSubscribed}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <Check className="h-4 w-4" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </span>
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 lg:p-8 rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isSubscribed ? (
              <Check className="h-6 w-6 text-primary" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg lg:text-xl font-bold mb-2">
            {isSubscribed ? "You're subscribed!" : "Get Renovation Tips in Your Inbox"}
          </h3>
          <p className="text-sm lg:text-base text-muted-foreground">
            {isSubscribed
              ? "Thanks for subscribing! Check your inbox for the latest guides."
              : "Expert renovation advice, cost guides, and design trends for North Jersey homeowners."}
          </p>
        </div>
      </div>

      {!isSubscribed && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Subscribe
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-xs text-muted-foreground">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </div>
  );
}
