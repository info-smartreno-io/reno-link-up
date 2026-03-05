import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle, Hammer, Home, Ruler, Users, ArrowRight, ArrowLeft, ClipboardList, ShieldCheck, DollarSign, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { SiteNavbar } from "@/components/SiteNavbar";
import { ComingSoonBanner } from "@/components/ComingSoonBanner";
import { EstimateForm } from "@/components/EstimateForm";
import { bergen, passaic, morris, essex, hudson } from "@/data/towns";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { AIChatBubble } from "@/components/website/AIChatBubble";
import { CostEstimatorWidget } from "@/components/website/CostEstimatorWidget";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { trackEvent } from "@/utils/analytics";
import constructionHero from "@/assets/construction-hero.jpg";
import kitchenReno from "@/assets/kitchen-reno.jpg";
import bathroomConstruction from "@/assets/bathroom-construction.jpg";
import howItWorks from "@/assets/how-it-works.jpg";
import exteriorRoofing from "@/assets/exterior-roofing.jpg";
import basementFinished from "@/assets/basement-finished.jpg";

/**
 * SmartReno — Landing Page (Clean UX)
 * - Simplified hierarchy & spacing
 * - Fewer visual boxes; clearer calls to action
 * - Consistent backgrounds (no heavy gradients)
 * - Prominent "Back to Home" button
 */

const brand = {
  name: "SmartReno",
  tagline: "Renovations, Simplified."
};
const Feature = ({
  children
}: {
  children: React.ReactNode;
}) => <div className="flex items-start gap-2 text-sm text-muted-foreground">
    <CheckCircle className="mt-0.5 h-4 w-4 text-accent" />
    <span>{children}</span>
  </div>;
const Step = ({
  idx,
  title,
  children,
  icon: Icon
}: {
  idx: number;
  title: string;
  children: React.ReactNode;
  icon: any;
}) => <motion.div initial={{
  opacity: 0,
  y: 10
}} whileInView={{
  opacity: 1,
  y: 0
}} viewport={{
  once: true
}} transition={{
  duration: 0.3,
  delay: idx * 0.05
}} className="rounded-2xl border p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {idx}</div>
        <div className="font-semibold">{title}</div>
      </div>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{children}</p>
  </motion.div>;
export default function Index() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Enable scroll depth tracking
  useScrollTracking();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        // Fetch user role from user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        if (roleData?.role) {
          setUserRole(roleData.role);
        }
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
      if (!session?.user) {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardPath = () => {
    switch (userRole) {
      case "admin": return "/admin/dashboard";
      case "estimator": return "/estimator/dashboard";
      case "contractor": return "/contractor/dashboard";
      case "architect": return "/architect/dashboard";
      case "interior_designer": return "/interiordesigner/dashboard";
      case "vendor": return "/vendor/dashboard";
      default: return "/homeowner/dashboard";
    }
  };
  
  // Simple breadcrumb generator (extend as needed)
  const breadcrumbs = [{
    label: "Home",
    href: "/"
  }, {
    label: "Overview",
    href: "#top"
  }];
  
  return <main className="min-h-screen bg-background" style={{ scrollBehavior: 'smooth' }}>
      <Helmet>
        <title>SmartReno – Home Renovations, Simplified in Northern NJ</title>
        <meta name="description" content="SmartReno helps Northern New Jersey homeowners plan and manage home renovations with a free estimate, vetted local contractors, and a guided process from intake through completion." />
        <link rel="canonical" href="https://smartreno.io/" />
        <meta name="robots" content="index,follow" />
        <meta name="application-name" content="SmartReno" />
        
        {/* Open Graph Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SmartReno – Renovations, Simplified in Northern NJ" />
        <meta property="og:description" content="One simple intake, a free estimate, and competitive bids from vetted local contractors. SmartReno simplifies home renovations across Bergen, Passaic, Morris, and Hudson counties." />
        <meta property="og:url" content="https://smartreno.io/" />
        <meta property="og:site_name" content="SmartReno" />
        <meta property="og:image" content="https://smartreno.io/og/home-hero.jpg" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SmartReno – Renovations, Simplified in Northern NJ" />
        <meta name="twitter:description" content="Get a free estimate and competitive bids from vetted local contractors for your home renovation in Northern NJ." />
        <meta name="twitter:image" content="https://smartreno.io/og/home-hero.jpg" />
        
        {/* Schema.org JSON-LD - Website */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SmartReno",
            "url": "https://smartreno.io/",
            "description": "SmartReno simplifies home renovations in Northern New Jersey with a free estimate, vetted contractors, and guided project management.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://smartreno.io/get-estimate"
              }
            }
          })}
        </script>
        
        {/* Schema.org JSON-LD - Service */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Home Renovation Marketplace",
            "name": "SmartReno Home Renovation Services",
            "description": "Professional home renovation marketplace connecting Northern New Jersey homeowners with vetted contractors. Get free estimates and competitive bids for kitchen remodels, bathroom renovations, additions, and more.",
            "provider": {
              "@type": "LocalBusiness",
              "name": "SmartReno",
              "url": "https://smartreno.io/",
              "telephone": "(201) 788-9502",
              "email": "info@smartreno.io",
              "priceRange": "$$",
              "areaServed": [
                { "@type": "AdministrativeArea", "name": "Bergen County, NJ" },
                { "@type": "AdministrativeArea", "name": "Passaic County, NJ" },
                { "@type": "AdministrativeArea", "name": "Morris County, NJ" },
                { "@type": "AdministrativeArea", "name": "Hudson County, NJ" }
              ],
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "NJ",
                "addressCountry": "US"
              }
            },
            "areaServed": [
              { "@type": "State", "name": "New Jersey" }
            ],
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": "https://smartreno.io/get-estimate"
            },
            "audience": {
              "@type": "Audience",
              "audienceType": "Homeowners in Northern New Jersey"
            }
          })}
        </script>
      </Helmet>
      <SiteNavbar />
      <ComingSoonBanner />

      {/* Header utility: breadcrumb (desktop) + slim actions */}
      <div className="border-b bg-background">
        
      </div>

      {/* Floating Home button (mobile) */}
      <div className="fixed left-4 bottom-4 z-40 md:hidden">
        <Button size="sm" className="rounded-full shadow-lg" asChild>
          <a href="/" aria-label="Back to Home">
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </a>
        </Button>
      </div>

      {/* Hero */}
      <section id="top" className="py-16 md:py-24" aria-label="Hero section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full mb-4">
              Northern New Jersey • Home Renovations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">Renovations, Simplified.</h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              One simple intake, a free estimate, and competitive bids from vetted local contractors — all managed in a single platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button 
                size="lg" 
                asChild 
                className="text-base"
                onClick={() => {
                  if (window.gtag) {
                    window.gtag('event', 'homepage_cta_click', {
                      cta_location: 'hero',
                      cta_text: 'Start My Free Estimate'
                    });
                  }
                }}
              >
                <Link to="/get-estimate" className="inline-flex items-center gap-2">
                  Start My Free Estimate <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <a href="#how-it-works">See How It Works</a>
              </Button>
              {isLoggedIn && (
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={() => navigate(getDashboardPath())}
                  className="text-base"
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  View Dashboard
                </Button>
              )}
            </div>
            <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl text-sm" role="list" aria-label="Key features">
              <Feature>Free, no-obligation estimate</Feature>
              <Feature>Vetted & insured contractors</Feature>
              <Feature>Serving Bergen, Passaic, Morris & Hudson counties</Feature>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={constructionHero} 
              alt="Professional home renovation consultation with contractor and homeowner reviewing plans in Northern New Jersey" 
              className="w-full h-[400px] lg:h-[500px] object-cover"
              width="600"
              height="500"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-lg font-semibold">Professional Renovations in Northern NJ</p>
              <p className="text-sm opacity-90 mt-1">Trusted by homeowners across Bergen, Passaic, Morris & Hudson counties</p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Selector - Who Are You? */}
      <section id="audiences" className="py-16 md:py-20 bg-muted/30 border-y" aria-labelledby="audiences-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="audiences-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Who Is SmartReno For?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" role="list" aria-label="User types">
            <Link 
              to="/homeowners" 
              className="group"
              onClick={() => trackEvent('homepage_nav_click', { link_destination: 'homeowners', link_text: 'Homeowners' })}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3" aria-hidden="true">
                    <Home className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Homeowners</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Plan your renovation with a free estimate, vetted contractors, and a guided process from start to finish.
                  </p>
                  <div className="text-accent font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Explore Homeowner Experience <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/contractors" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                    <Hammer className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Receive qualified project opportunities, submit bids, and manage jobs in one portal.
                  </p>
                  <div className="text-accent font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Learn About Contractor Portal <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/architects" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                    <Ruler className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Architects & Designers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Partner with SmartReno for consistent project flow and a smoother client experience.
                  </p>
                  <div className="text-accent font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Partner With Us <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/real-estate" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Real Estate Professionals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Help your buyers and sellers navigate renovation with a trusted partner.
                  </p>
                  <div className="text-accent font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    See Real Estate Partner Options <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* How SmartReno Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-muted/30" aria-labelledby="how-it-works-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">How SmartReno Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We combine estimating, contractor bidding, and project oversight into one clear workflow.
            </p>
            <div className="inline-block mt-4 px-4 py-2 bg-accent/10 text-accent text-sm font-medium rounded-full">
              Free estimate • No obligation • Northern NJ only
            </div>
          </div>
          
          {/* Process showcase with image */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              <Step idx={1} title="Tell Us About Your Project" icon={ClipboardList}>
                Share your goals, budget, and photos in a quick online intake.
              </Step>
              <Step idx={2} title="Get a Free On-Site Estimate" icon={Ruler}>
                A SmartReno estimator visits your home to measure and build a detailed scope.
              </Step>
              <Step idx={3} title="Receive Competitive Bids" icon={DollarSign}>
                We send your project to vetted contractors and organize their proposals so you can compare clearly.
              </Step>
              <Step idx={4} title="Start Your Renovation with Support" icon={ShieldCheck}>
                You choose your contractor, and SmartReno helps manage timelines, communication, and next steps.
              </Step>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={howItWorks} 
                alt="Professional home renovation consultation showing SmartReno expert reviewing plans with homeowners in Bergen County" 
                className="w-full h-[500px] object-cover"
                width="600"
                height="500"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why SmartReno - Benefits */}
      <section className="py-16 md:py-20 border-t" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="benefits-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Why Renovate With SmartReno?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Vetted Local Pros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every contractor is licensed, insured, and reviewed before joining the network.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Clarity on Cost & Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We define your project properly so bids are comparable and realistic — no more guesswork.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Less Stress, More Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You're not juggling texts, emails, and paperwork alone. SmartReno centralizes everything.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-3">
                  <Home className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Built for Northern NJ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We understand local pricing, codes, and what renovations actually cost in this market.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tools & Calculators */}
      <section className="py-16 md:py-20 bg-muted/30" aria-labelledby="tools-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="tools-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Plan Smarter With Our Tools</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4">
                  <Home className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl">Home Addition Cost Calculator (NJ)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Estimate what an addition or add-a-level could cost in your area.
                </p>
                <Button asChild className="w-full font-semibold" size="lg">
                  <a href="https://jersey-digs-data.lovable.app/pro-calculator" target="_blank" rel="noopener noreferrer">
                    Use Calculator
                  </a>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4">
                  <Hammer className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl">Interior Renovation Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Rough pricing for kitchens, bathrooms, basements, and more.
                </p>
                <Button asChild className="w-full font-semibold" size="lg">
                  <a href="https://jersey-digs-data.lovable.app/pro-calculator" target="_blank" rel="noopener noreferrer">
                    Plan My Interior Project
                  </a>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4">
                  <DollarSign className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl">Financing Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Compare HELOCs, home equity loans, and renovation-friendly financing.
                </p>
                <Button asChild className="w-full font-semibold" size="lg">
                  <a href="https://jersey-digs-data.lovable.app/financing" target="_blank" rel="noopener noreferrer">
                    Explore Financing
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage Area / Local SEO */}
      <section className="py-16 md:py-20 border-t" aria-labelledby="coverage-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <img 
                src="/images/exterior-renovations.jpg" 
                alt="Expert exterior home renovation including roofing and siding in Bergen County, Northern New Jersey" 
                className="w-full h-[500px] object-cover"
                width="600"
                height="500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-lg font-semibold">Expert Exterior Renovations</p>
                <p className="text-sm opacity-90 mt-1">Roofing, siding, windows, and more across Northern NJ</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 id="coverage-heading" className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Serving Northern New Jersey Homeowners
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                SmartReno is currently focused on these core counties, with more areas coming soon.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bergen County</h3>
                  <p className="text-sm text-muted-foreground">
                    Ridgewood, Paramus, Mahwah, Fair Lawn, Fort Lee, Tenafly, and more
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Passaic County</h3>
                  <p className="text-sm text-muted-foreground">
                    Wayne, Clifton, Little Falls, Woodland Park, West Milford
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Morris County</h3>
                  <p className="text-sm text-muted-foreground">
                    Morristown, Denville, Parsippany, Randolph, Madison
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Hudson County</h3>
                  <p className="text-sm text-muted-foreground">
                    Hoboken, Jersey City, Weehawken, Union City
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-16 md:py-20 bg-muted/30" aria-labelledby="testimonials-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">What Homeowners Are Saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500">⭐</span>)}
                </div>
                <p className="text-sm mb-4">
                  "SmartReno made our kitchen renovation so much easier. Having one estimator come out and then getting multiple bids was perfect."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    TC
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Thomas & Cynthia</div>
                    <div className="text-xs text-muted-foreground">Mahwah, NJ • Verified Homeowner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500">⭐</span>)}
                </div>
                <p className="text-sm mb-4">
                  "Great experience from start to finish. The contractor we chose through SmartReno was professional and completed our bathroom on time."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    SM
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah M.</div>
                    <div className="text-xs text-muted-foreground">Ridgewood, NJ • Verified Homeowner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500">⭐</span>)}
                </div>
                <p className="text-sm mb-4">
                  "Finally, a renovation platform that actually helps instead of just collecting your info. The free estimate was detailed and accurate."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    JR
                  </div>
                  <div>
                    <div className="font-semibold text-sm">John R.</div>
                    <div className="text-xs text-muted-foreground">Wayne, NJ • Verified Homeowner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Contractors & Pros */}
      <section className="py-16 md:py-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">For Contractors & Industry Pros</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">For Contractors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Get qualified project opportunities, streamline bidding, and stay organized with a dedicated contractor portal.
                </p>
                <ul className="space-y-2 mb-6">
                  <Feature>No random tire-kickers</Feature>
                  <Feature>Structured scopes and timelines</Feature>
                  <Feature>Messaging, documents, and timelines in one place</Feature>
                </ul>
                <Button asChild size="lg" className="w-full">
                  <Link to="/contractors">Visit Contractor Portal</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Partners – Architects, Designers, Real Estate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Plug SmartReno into your projects to improve client experience and close more deals.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link to="/architects">Partner With SmartReno</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Project Showcase */}
      <section className="py-16 md:py-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Popular Renovation Projects</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From kitchens to basements, we help Northern NJ homeowners bring their vision to life
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Kitchen Renovation */}
            <div className="group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden shadow-xl mb-4">
                <img 
                  src={kitchenReno} 
                  alt="Luxurious modern kitchen remodel with custom cabinets, quartz countertops, and stainless appliances in Northern NJ" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  width="400"
                  height="256"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold">Kitchen Remodeling</h3>
                  <p className="text-sm opacity-90">Complete renovations from $30k-$150k+</p>
                </div>
              </div>
            </div>

            {/* Bathroom Renovation */}
            <div className="group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden shadow-xl mb-4">
                <img 
                  src={bathroomConstruction} 
                  alt="Professional bathroom renovation contractors" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold">Bathroom Remodeling</h3>
                  <p className="text-sm opacity-90">Modern updates starting at $15k</p>
                </div>
              </div>
            </div>

            {/* Basement Finishing */}
            <div className="group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden shadow-xl mb-4">
                <img 
                  src={basementFinished} 
                  alt="Finished basement renovation Northern NJ" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold">Basement Finishing</h3>
                  <p className="text-sm opacity-90">Add living space from $40k-$100k+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Content */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Learn Before You Renovate</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/blog/northern-nj-addition-costs" className="group">
              <Card className="h-full hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-accent transition-colors">
                    How Much Does a Home Addition Cost in Northern NJ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Breaking down the costs of adding square footage to your home in Bergen, Passaic, and Morris counties.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/blog/kitchen-remodel-budget" className="group">
              <Card className="h-full hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-accent transition-colors">
                    Kitchen Remodel Budget Ranges: Starter, Mid, High-End
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Understanding what you get at different price points for kitchen renovations in NJ.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/blog/permits-101" className="group">
              <Card className="h-full hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-accent transition-colors">
                    Permits 101: What You Need Before You Start
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    A guide to understanding building permits and inspections in Northern New Jersey.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-accent/10 to-primary/10 border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Ready to Start Your Renovation?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Answer a few quick questions and get a free, no-obligation estimate and competitive bids from vetted Northern NJ contractors.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
            <Link to="/get-estimate">
              Start My Free Estimate <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer to talk it through first? Email{" "}
            <a href="mailto:info@smartreno.io" className="underline hover:text-accent transition-colors">
              info@smartreno.io
            </a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-8">
            If you don't see your question, email{" "}
            <a className="underline hover:text-accent transition-colors" href="mailto:info@smartreno.io">
              info@smartreno.io
            </a>
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="item-1" className="border rounded-lg px-4">
              <AccordionTrigger>How does SmartReno make money?</AccordionTrigger>
              <AccordionContent>
                Contractors pay a small service fee when they win projects through our platform. Homeowners never pay for estimates or to use SmartReno.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border rounded-lg px-4">
              <AccordionTrigger>Is the estimate really free?</AccordionTrigger>
              <AccordionContent>
                Yes. A SmartReno estimator visits your home, measures, and creates a detailed project scope at no charge to you.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border rounded-lg px-4">
              <AccordionTrigger>What if I don't like any of the contractor bids?</AccordionTrigger>
              <AccordionContent>
                No problem. There's zero obligation. You can walk away or ask us to find additional contractors.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border rounded-lg px-4">
              <AccordionTrigger>Do you work with architects or designers?</AccordionTrigger>
              <AccordionContent>
                Yes! We have partnerships with local architects and interior designers. If your project requires design work, we can connect you.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border rounded-lg px-4">
              <AccordionTrigger>What areas do you serve?</AccordionTrigger>
              <AccordionContent>
                Currently Bergen, Passaic, Morris, and Hudson counties in Northern New Jersey, with plans to expand to additional areas soon.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Get Started */}
      <section id="get-started" className="py-14 bg-muted/30 border-y">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-semibold">Ready to start?</h3>
            <p className="mt-2 text-muted-foreground">Book a 60‑minute estimator visit. Get a verified scope and three bids.</p>
          </div>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Request Your Free Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <EstimateForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer with Service Areas */}
      <footer className="py-10 pt-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Footer Links */}
          <div className="grid gap-8 md:grid-cols-4 text-sm mb-12">
            <div>
              <div className="font-semibold">{brand.name}</div>
              <p className="mt-2 text-muted-foreground mb-3">Local first in Northern NJ.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/locations/bergen-county" className="hover:underline">Bergen County</Link></li>
                <li><Link to="/locations/passaic-county" className="hover:underline">Passaic County</Link></li>
                <li><Link to="/locations/morris-county" className="hover:underline">Morris County</Link></li>
                <li><Link to="/locations/essex-county" className="hover:underline">Essex County</Link></li>
                <li><Link to="/locations/hudson-county" className="hover:underline">Hudson County</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Explore</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="#how">How it works</a></li>
                <li><a className="hover:underline" href="#audiences">Homeowners & Contractors</a></li>
                <li><a className="hover:underline" href="#faq">FAQ</a></li>
                <li><Link to="/locations" className="hover:underline">Service Locations</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Company</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:underline">About</Link></li>
                <li><Link to="/careers" className="hover:underline">Careers</Link></li>
                <li><Link to="/blog" className="hover:underline">Blog</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Contact</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="underline" href="mailto:info@smartreno.io">info@smartreno.io</a></li>
                <li>(201) 788-9502</li>
              </ul>
            </div>
          </div>

        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground border-t pt-6">
          © {new Date().getFullYear()} SmartReno. All rights reserved.
        </div>
      </footer>

      <FooterAdminLogin />
      
      <AIChatBubble />
    </main>;
}