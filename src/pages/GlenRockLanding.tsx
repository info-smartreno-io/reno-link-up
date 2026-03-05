import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeSection } from "@/components/homepage/IntakeSection";
import { trackEvent } from "@/utils/analytics";

/**
 * Glen Rock Google Ads Landing Page
 * Custom landing page optimized for Google Ads traffic
 * Mirrors Fair Lawn page structure with Glen Rock-specific content
 */
export default function GlenRockLanding() {
  const scrollToForm = () => {
    const el = document.getElementById("start-project");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      trackEvent("glen_rock_cta_click", { location: "glenrock", cta_location: "hero" });
    }
  };

  return (
    <>
      <Helmet>
        <title>SmartReno Glen Rock | Renovation Planning & Structured Bidding</title>
        <meta
          name="description"
          content="Plan your renovation in Glen Rock with a structured consultation. Define scope, compare bids, and avoid costly surprises."
        />
        <link rel="canonical" href="https://smartreno.io/glenrock" />
        <meta name="robots" content="index,follow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="SmartReno Glen Rock | Renovation Planning & Structured Bidding" />
        <meta
          property="og:description"
          content="Plan your renovation in Glen Rock with a structured consultation. Define scope, compare bids, and avoid costly surprises."
        />
        <meta property="og:url" content="https://smartreno.io/glenrock" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SmartReno Glen Rock | Renovation Planning & Structured Bidding" />
        <meta
          name="twitter:description"
          content="Plan your renovation in Glen Rock with a structured consultation. Define scope, compare bids, and avoid costly surprises."
        />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "SmartReno - Glen Rock",
            url: "https://smartreno.io/glenrock",
            description:
              "Plan your renovation in Glen Rock with a structured consultation. Define scope, compare bids, and avoid costly surprises.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Glen Rock",
              addressRegion: "NJ",
              addressCountry: "US",
              postalCode: "07452",
            },
            areaServed: {
              "@type": "City",
              name: "Glen Rock",
              containedIn: { "@type": "AdministrativeArea", name: "Bergen County" },
            },
            serviceType: "Home Renovation Planning",
            priceRange: "$$",
            telephone: "(201) 788-9502",
            email: "info@smartreno.io",
          })}
        </script>
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Planning a Renovation in Glen Rock?
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              Before hiring a contractor, define your project clearly. SmartReno structures your
              renovation so you can compare real numbers — not guesswork.
            </p>

            <Button size="lg" onClick={scrollToForm}>
              Book Your Structured Consultation
            </Button>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Most Renovations Go Off Track
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Most renovations go off track before work even starts. Homeowners often call multiple
              contractors before the scope is clearly defined — which leads to wildly different
              quotes, budget expansion, and timeline shifts.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">The issue isn't bad contractors.</span>
              <br />
              It's lack of structure at the beginning.
            </p>
          </div>
        </section>

        {/* Authority Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">
              Built From Real Field Experience
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  4,000+ in-home consultations completed
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  $8M+ in residential renovation sales
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Projects from $2,000 repairs to $500,000 additions
                </span>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Projects succeed when scope is clearly defined before contractors bid.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-10">How It Works</h2>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Structured Intake</h3>
                <p className="text-muted-foreground">
                  Tell us about your project and goals in a guided consultation.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Scope Development</h3>
                <p className="text-muted-foreground">
                  We define a clear, detailed scope so every contractor bids on the same plan.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Controlled Contractor Bidding</h3>
                <p className="text-muted-foreground">
                  Compare apples-to-apples bids from vetted, local contractors.
                </p>
              </div>
            </div>

            <p className="text-center text-lg font-semibold text-foreground mt-10">
              No confusion. No vague allowances. No guessing.
            </p>
          </div>
        </section>

        {/* Local Context Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Renovations in Glen Rock, NJ
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Glen Rock homes often involve:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Kitchen and bathroom modernization
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Layout adjustments in older colonials and split-levels
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">Mechanical upgrades</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">Permit coordination</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Additions for growing families
                </span>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              When planning isn't structured upfront, surprises appear mid-project. SmartReno
              reduces that risk before bidding begins.
            </p>
          </div>
        </section>

        {/* Who This Is For Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Designed for Glen Rock Homeowners Who:
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">Want organized planning</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Prefer structure over chaos
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Budget typically $25K–$250K+
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-lg text-muted-foreground">
                  Want comparable bids and informed decisions
                </span>
              </div>
            </div>

            <Button size="lg" onClick={scrollToForm}>
              Book Your Structured Consultation
            </Button>
          </div>
        </section>

        {/* Form Section - Reuses IntakeSection */}
        <IntakeSection />
      </main>

      <SiteFooter />
    </>
  );
}
