import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, CheckCircle2 } from "lucide-react";

interface ServiceWaitlistFormProps {
  serviceInterest?: 'drain_cleaning' | 'gutter_cleaning' | 'handyman' | 'all';
  serviceName?: string;
}

export function ServiceWaitlistForm({ 
  serviceInterest = 'all',
  serviceName = 'our daily services' 
}: ServiceWaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    zipCode: '',
    notifyOnLaunch: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('service_waitlist').insert({
        email: formData.email,
        name: formData.name || null,
        phone: formData.phone || null,
        zip_code: formData.zipCode || null,
        service_interest: serviceInterest,
        notify_on_launch: formData.notifyOnLaunch,
        source: 'allinonehome.com',
      });

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already on the waitlist! We'll notify you when we launch.");
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        toast.success("You're on the list! We'll notify you when this service launches.");
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Waitlist error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
          <p className="text-muted-foreground max-w-sm">
            We'll notify you as soon as {serviceName} {serviceInterest === 'all' ? 'are' : 'is'} available in your area.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Join the Waitlist</CardTitle>
        </div>
        <CardDescription>
          Be the first to know when {serviceName} {serviceInterest === 'all' ? 'launch' : 'launches'} in your area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(201) 555-1234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code (optional)</Label>
            <Input
              id="zipCode"
              placeholder="07410"
              maxLength={5}
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={formData.notifyOnLaunch}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, notifyOnLaunch: checked as boolean })
              }
            />
            <Label htmlFor="notify" className="text-sm text-muted-foreground cursor-pointer">
              Notify me when this service launches
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
