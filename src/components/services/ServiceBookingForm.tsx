import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { CalendarIcon, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServicePricingCard } from "./ServicePricingCard";
import type { ServiceData, ServiceOption, AddOn } from "@/data/serviceData";

interface ServiceBookingFormProps {
  service: ServiceData;
  mode?: 'booking' | 'waitlist';
}

export function ServiceBookingForm({ service, mode = 'booking' }: ServiceBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [step, setStep] = useState<'options' | 'details' | 'confirm'>('options');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceAddress: '',
    city: '',
    zipCode: '',
    accessNotes: '',
  });

  const totalPrice = useMemo(() => {
    let total = selectedOption?.price || 0;
    selectedAddOns.forEach((addon) => {
      // For per_unit pricing, we'd need quantity - for now just add flat price
      total += addon.price;
    });
    return total;
  }, [selectedOption, selectedAddOns]);

  const toggleAddOn = (addon: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleSubmitBooking = async () => {
    if (!selectedOption) {
      toast.error('Please select a service option');
      return;
    }

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.serviceAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        service_type: service.id,
        service_options: [{ name: selectedOption.name, price: selectedOption.price }],
        add_ons: selectedAddOns.map((a) => ({ name: a.name, price: a.price })),
        total_price: totalPrice,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        service_address: formData.serviceAddress,
        city: formData.city || null,
        zip_code: formData.zipCode || null,
        preferred_date: preferredDate ? format(preferredDate, 'yyyy-MM-dd') : null,
        preferred_time_slot: timeSlot || null,
        access_notes: formData.accessNotes || null,
        status: 'pending_payment',
        payment_status: 'pending',
        source: 'allinonehome.com',
      };

      const { data, error } = await supabase
        .from('service_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      // TODO: Call SmartReno API when available
      // For now, show success and instruction to pay
      toast.success('Booking submitted! We\'ll contact you shortly to confirm and collect payment.');
      setStep('confirm');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Something went wrong. Please try again or call us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'confirm') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-4">
            <Check className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Booking Submitted!</h3>
          <p className="text-muted-foreground max-w-sm mb-4">
            Thank you for choosing All In One Home Solutions. We'll contact you within 2 hours to confirm your appointment and collect payment.
          </p>
          <div className="bg-background rounded-lg p-4 w-full max-w-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{selectedOption?.name}</span>
            </div>
            {preferredDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Date:</span>
                <span className="font-medium">{format(preferredDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-primary">${totalPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book {service.name}</CardTitle>
        <CardDescription>
          {step === 'options' && 'Select your service option and any add-ons'}
          {step === 'details' && 'Enter your contact and service details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'options' && (
          <>
            {/* Service Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Service Type *</Label>
              <div className="grid gap-3">
                {service.options.map((option) => (
                  <ServicePricingCard
                    key={option.id}
                    name={option.name}
                    description={option.description}
                    price={option.price}
                    popular={option.popular}
                    selected={selectedOption?.id === option.id}
                    onSelect={() => setSelectedOption(option)}
                  />
                ))}
              </div>
            </div>

            {/* Add-ons */}
            {service.addOns.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Optional Add-Ons</Label>
                <div className="space-y-2">
                  {service.addOns.map((addon) => (
                    <div
                      key={addon.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedAddOns.find((a) => a.id === addon.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => toggleAddOn(addon)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={!!selectedAddOns.find((a) => a.id === addon.id)}
                          onCheckedChange={() => toggleAddOn(addon)}
                        />
                        <div>
                          <p className="font-medium">{addon.name}</p>
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-primary">
                        +${addon.price}
                        {addon.priceType === 'per_unit' && `/${addon.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary */}
            {selectedOption && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{selectedOption.name}</span>
                  <span>${selectedOption.price}</span>
                </div>
                {selectedAddOns.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span>{addon.name}</span>
                    <span>+${addon.price}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-primary">${totalPrice}</span>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name *</Label>
                <Input
                  id="customerName"
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(201) 555-1234"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="you@email.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAddress">Service Address *</Label>
              <Input
                id="serviceAddress"
                placeholder="123 Main Street"
                value={formData.serviceAddress}
                onChange={(e) => setFormData({ ...formData, serviceAddress: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Fair Lawn"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="07410"
                  maxLength={5}
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !preferredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {preferredDate ? format(preferredDate, 'PPP') : 'Select a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={preferredDate}
                      onSelect={setPreferredDate}
                      disabled={(date) => date < addDays(new Date(), 1)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm - 4pm)</SelectItem>
                    <SelectItem value="evening">Evening (4pm - 7pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessNotes">Access Notes (optional)</Label>
              <Textarea
                id="accessNotes"
                placeholder="Gate code, parking instructions, pet info, etc."
                value={formData.accessNotes}
                onChange={(e) => setFormData({ ...formData, accessNotes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Price Reminder */}
            <div className="bg-primary/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedOption?.name}</p>
                {selectedAddOns.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    + {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <span className="text-xl font-bold text-primary">${totalPrice}</span>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Payment will be collected after you submit. We'll contact you to confirm the appointment and process payment securely.
              </p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        {step === 'details' && (
          <Button variant="outline" onClick={() => setStep('options')}>
            Back
          </Button>
        )}
        {step === 'options' && (
          <Button
            className="flex-1"
            onClick={() => setStep('details')}
            disabled={!selectedOption}
          >
            Continue
          </Button>
        )}
        {step === 'details' && (
          <Button
            className="flex-1"
            onClick={handleSubmitBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              `Book Now - $${totalPrice}`
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
