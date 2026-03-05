import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceBookingForm } from "@/components/services/ServiceBookingForm";
import { ServiceWaitlistForm } from "@/components/services/ServiceWaitlistForm";
import { getServiceBySlug } from "@/data/serviceData";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Shield, MapPin } from "lucide-react";

// Set this to true to show waitlist form instead of booking form
const WAITLIST_MODE = false;

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || '');

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{service.name} Services | Flat-Rate Pricing | All In One Home Solutions</title>
        <meta name="description" content={`${service.description} Starting at $${service.basePrice}. Same-day service in Northern NJ.`} />
      </Helmet>
      <SiteNavbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Badge className="mb-4">Same-Day Service Available</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{service.name}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">{service.tagline}</p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left: Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">About This Service</h2>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> What's Included
                  </h3>
                  <ul className="space-y-1.5">
                    {service.features.map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Duration
                  </h3>
                  <p className="text-sm text-muted-foreground">Typically {service.processDuration}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Service Areas
                  </h3>
                  <p className="text-sm text-muted-foreground">{service.serviceAreas.join(', ')}</p>
                </div>
              </div>

              {/* Right: Booking Form */}
              <div className="lg:col-span-3">
                {WAITLIST_MODE ? (
                  <ServiceWaitlistForm 
                    serviceInterest={service.id as any} 
                    serviceName={service.name} 
                  />
                ) : (
                  <ServiceBookingForm service={service} />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        {service.faqs.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
              <div className="max-w-3xl mx-auto space-y-4">
                {service.faqs.map((faq, i) => (
                  <div key={i} className="bg-background rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
