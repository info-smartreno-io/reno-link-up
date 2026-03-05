import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle, ClipboardList, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { ComingSoonBanner } from "@/components/ComingSoonBanner";
import { IntakeSection } from "@/components/homepage/IntakeSection";
import { ProductCarousel } from "@/components/homepage/ProductCarousel";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import constructionHero from "@/assets/construction-hero.jpg";

export default function NewIndex() {
  const scrollToIntake = () => {
    const intakeSection = document.getElementById("start-project");
    intakeSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>SmartReno – Home Renovations, Simplified in Northern NJ</title>
        <meta name="description" content="One intake. Three competitive bids. Expert guidance from vetted local contractors across Bergen, Passaic, Morris & Hudson counties." />
        <link rel="canonical" href="https://smartreno.io/" />
      </Helmet>

      <SiteNavbar />
      <ComingSoonBanner />

      {/* Hero Section - Updated Copy Only */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full mb-4">
              Northern New Jersey • Home Renovations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Renovations, Simplified for Northern NJ
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              One intake. Three competitive bids. Expert guidance from vetted local contractors across Bergen, Passaic, Morris & Hudson counties.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={scrollToIntake} className="text-base">
                Start My Project <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={constructionHero} 
              alt="Professional home renovation in Northern New Jersey" 
              className="w-full h-[400px] lg:h-[500px] object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Intake Form Section */}
      <IntakeSection />

      {/* How SmartReno Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How SmartReno Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-6">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Share Your Project</h3>
                <p className="text-muted-foreground">
                  Tell us about your home, budget, and goals. We focus on Northern NJ, so your matches are truly local.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Get 3 Vetted Bids</h3>
                <p className="text-muted-foreground">
                  We match you with up to three pre-vetted contractors based on project type, budget, and location.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Choose With Confidence</h3>
                <p className="text-muted-foreground">
                  Compare proposals side by side, get estimator guidance, and move forward with clarity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Why homeowners choose SmartReno
          </h2>

          <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
              <div className="p-8">
                <h3 className="font-semibold text-lg mb-6 text-muted-foreground">Without SmartReno</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">Random Google searches</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">Inconsistent scopes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">No guidance</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">Surprise change orders</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-accent/5">
                <h3 className="font-semibold text-lg mb-6 text-accent">With SmartReno</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <p>Curated, vetted local contractors</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <p>Side-by-side, aligned proposals</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <p>Dedicated estimator support</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <p>Transparent scopes + tracked walkthroughs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SmartReno Protections */}
      <section className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Feel protected at every step
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Clear scopes to reduce change orders</h3>
                <p className="text-sm text-muted-foreground">Detailed estimates mean fewer surprises</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Tracked walkthroughs, notes & photos</h3>
                <p className="text-sm text-muted-foreground">Everything documented in one place</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Transparent communication in one portal</h3>
                <p className="text-sm text-muted-foreground">No more email chains or lost messages</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Local pros who stand behind their work</h3>
                <p className="text-sm text-muted-foreground">Vetted contractors with proven track records</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="areas">
              <AccordionTrigger>What areas do you serve?</AccordionTrigger>
              <AccordionContent>
                SmartReno serves Bergen, Passaic, Morris, Essex, and Hudson counties in Northern New Jersey. We focus exclusively on this region to ensure quality contractor networks and local expertise.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing">
              <AccordionTrigger>How does pricing work?</AccordionTrigger>
              <AccordionContent>
                SmartReno's intake and estimating services are free for homeowners. We're paid by contractors when projects are successfully matched. You'll receive transparent, competitive bids from vetted contractors with no hidden fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contractors">
              <AccordionTrigger>How are contractors vetted?</AccordionTrigger>
              <AccordionContent>
                All SmartReno contractors must be licensed, insured, and pass background checks. We verify their work history, review past projects, and maintain ongoing quality standards through homeowner feedback.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="size">
              <AccordionTrigger>What project sizes do you handle?</AccordionTrigger>
              <AccordionContent>
                SmartReno works with projects ranging from $10,000 to $100,000+. Whether it's a bathroom refresh, kitchen remodel, basement finish, or full home addition, we can help match you with the right contractors.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <FooterAdminLogin />
    </main>
  );
}
