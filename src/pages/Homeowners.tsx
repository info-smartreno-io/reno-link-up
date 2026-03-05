import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Check, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { AIChatBubble } from "@/components/website/AIChatBubble";
import heroImage from "@/assets/contractor-homeowner-outdoor.jpg";
import smartrenoLogo from "@/assets/smartreno-logo-header.png";
import exteriorRenovation from "@/assets/exterior-renovation.jpg";
import kitchenRemodel from "@/assets/kitchen-remodel.jpg";
import bathroomUpgrade from "@/assets/bathroom-upgrade.jpg";
import basementLiving from "@/assets/basement-living.jpg";
import homeAddition from "@/assets/home-addition.jpg";
import wholeHomeReno from "@/assets/whole-home-reno.jpg";

const projectTypes = [
  { title: "Kitchen Remodel", subtitle: "Update layout, cabinets, counters, and finishes with a trusted contractor.", cta: "Plan My Kitchen Project", type: "Kitchen Remodel" },
  { title: "Bathroom Remodel", subtitle: "Transform your bathroom with modern fixtures, tile, and expert installation.", cta: "Plan My Bathroom Project", type: "Bathroom Remodel" },
  { title: "Basement Finish/Remodel", subtitle: "Turn your basement into usable living space with professional finishing.", cta: "Plan My Basement Project", type: "Basement Finish" },
  { title: "Home Addition / Add-A-Level", subtitle: "Expand your home with additions that blend seamlessly with your existing structure.", cta: "Plan My Addition Project", type: "Addition" },
  { title: "Exterior (Roof, Siding, Windows, Doors)", subtitle: "Upgrade your home's exterior with quality materials and expert installation.", cta: "Plan My Exterior Project", type: "Exterior" },
  { title: "Whole-Home Renovation", subtitle: "Complete home transformations with coordinated design and execution.", cta: "Plan My Whole-Home Project", type: "Whole-Home Renovation" },
];

const benefits = [
  { title: "Vetted Contractors Only", description: "Licensed, insured, and reviewed pros — no random leads from the internet." },
  { title: "Clear Scope & Pricing", description: "You get a structured estimate so you can compare apples-to-apples." },
  { title: "Local Northern NJ Expertise", description: "We understand permits, local pricing, and what renovations actually cost here." },
  { title: "Support from Estimate to Completion", description: "SmartReno stays involved so you're not managing everything alone." },
];


const faqs = [
  {
    question: "How much does a typical kitchen remodel cost in Northern NJ?",
    answer: "Most SmartReno kitchen projects fall between $25,000 and $100,000+, depending on size, materials and layout changes."
  },
  {
    question: "How does SmartReno vet contractors?",
    answer: "We verify licensing where required, insurance, experience and recent project quality before inviting contractors onto the platform."
  },
  {
    question: "Do I pay SmartReno or the contractor?",
    answer: "You pay contractors directly. SmartReno helps you scope the project, compare bids and manage the process from first intake through contractor selection."
  },
  {
    question: "What areas of New Jersey do you serve?",
    answer: "We currently serve Bergen, Passaic, Morris and Hudson counties, with additional regions planned for future expansion."
  },
];

export default function Homeowners() {
  const [formState, setFormState] = useState({
    full_name: "",
    email: "",
    phone: "",
    project_type: "Kitchen Remodel",
    zip: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ ok: false, msg: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((s) => ({ ...s, [name]: value }));
  };

  const utmFromLocation = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const obj: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
      if (params.get(k)) obj[k] = String(params.get(k));
    });
    return obj;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ ok: false, msg: "" });

    if (!formState.full_name || !formState.email) {
      setStatus({ ok: false, msg: "Please enter your name and email." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/estimate-request/homeowner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          source: "web",
          utm: utmFromLocation,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus({ ok: true, msg: "Thanks! We'll reach out shortly to schedule your estimate." });
      setFormState({ full_name: "", email: "", phone: "", project_type: "Kitchen Remodel", zip: "", description: "" });
    } catch {
      setStatus({ ok: false, msg: "Something went wrong. Please try again or email info@smartreno.io." });
    } finally {
      setSubmitting(false);
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
<title>SmartReno for Homeowners | Kitchen, Bath & Home Remodeling in Northern NJ</title>
        <meta name="description" content="SmartReno helps Northern NJ homeowners get one seamless intake and three competitive bids for kitchens, bathrooms, basements, additions and full remodels. Serving Bergen, Passaic, Morris & Hudson counties with vetted, insured contractors and expert estimator guidance." />
        <link rel="canonical" href="https://smartreno.io/homeowners" />
        
<meta property="og:type" content="website" />
        <meta property="og:title" content="SmartReno for Homeowners | Renovations, Simplified in Northern NJ" />
        <meta property="og:description" content="One intake, three competitive bids, and expert estimator guidance for Northern NJ homeowners. Vetted contractors, clear pricing, managed process." />
        <meta property="og:url" content="https://smartreno.io/homeowners" />
        <meta property="og:site_name" content="SmartReno" />
        <meta property="og:image" content="https://smartreno.io/og/homeowners-hero.jpg" />
        
<meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SmartReno for Homeowners | Kitchen, Bath & Home Remodeling in Northern NJ" />
        <meta name="twitter:description" content="SmartReno connects homeowners in Bergen, Passaic, Morris & Hudson counties with vetted remodeling contractors and expert guidance." />
        <meta name="twitter:image" content="https://smartreno.io/og/homeowners-hero.jpg" />
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>

        {/* Business/Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HomeAndConstructionBusiness",
            "name": "SmartReno",
            "url": "https://smartreno.io",
            "logo": "https://smartreno.io/apple-touch-icon.png",
            "areaServed": [
              { "@type": "Place", "name": "Bergen County, New Jersey" },
              { "@type": "Place", "name": "Passaic County, New Jersey" },
              { "@type": "Place", "name": "Morris County, New Jersey" },
              { "@type": "Place", "name": "Hudson County, New Jersey" }
            ],
            "description": "SmartReno helps Northern New Jersey homeowners compare renovation bids from vetted contractors with expert estimator guidance.",
            "sameAs": [
              "https://www.instagram.com/smart_reno_"
            ]
          })}
        </script>
      </Helmet>

      <SiteNavbar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Renovations for Northern NJ Homeowners, Simplified
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                SmartReno connects homeowners in Bergen, Passaic, Morris and Hudson counties with vetted remodeling contractors for kitchens, bathrooms, basements, additions and full home renovations. One intake, three competitive bids, expert estimator guidance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => scrollToSection("estimate-form")} aria-label="Start your SmartReno home renovation estimate">
                  Get 3 Competitive Bids
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection("how-it-works")}>
                  How SmartReno Works
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Free Estimate – No Upfront Cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Vetted & Insured Contractors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Serving Northern New Jersey</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={heroImage} 
                alt="SmartReno estimator reviewing plans with a homeowner in a newly renovated kitchen in Northern New Jersey" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What Are You Renovating? */}
      <section id="projects" className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Are You Renovating?</h2>
            <p className="text-lg text-muted-foreground">Select your project type to get started</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectTypes.map((project, idx) => (
              <div 
                key={idx}
                className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setFormState(s => ({ ...s, project_type: project.type }));
                  scrollToSection("estimate-form");
                }}
              >
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4">{project.subtitle}</p>
                <Button variant="outline" className="w-full">{project.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How SmartReno Works */}
      <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold mb-4">How SmartReno Works for Homeowners</h2>
            <p className="text-sm text-muted-foreground">Free Estimate • No obligation to hire a contractor</p>
          </div>

          <ol className="grid md:grid-cols-3 gap-8 list-none">
            <li className="relative">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Tell us about your project</h3>
              <p className="text-muted-foreground">Share photos, your budget range and location for your kitchen, bath, basement or home remodel.</p>
            </li>

            <li className="relative">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">We match you with vetted contractors</h3>
              <p className="text-muted-foreground">Our estimators send your project to screened, insured contractors who fit your scope and schedule.</p>
            </li>

            <li className="relative">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Compare bids and start with confidence</h3>
              <p className="text-muted-foreground">Review up to three detailed proposals, ask questions inside the SmartReno portal, and choose the best fit.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Service Area / Locations Section */}
      <section aria-labelledby="service-areas-heading" className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 id="service-areas-heading" className="text-3xl md:text-4xl font-bold mb-4">Serving Northern New Jersey Homeowners</h2>
            <p className="text-lg text-muted-foreground mb-8">SmartReno currently helps homeowners in the following counties:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><Link to="/locations/bergen-county" className="font-semibold text-foreground hover:underline">Bergen County</Link> – Ridgewood, Paramus, Hackensack, Fair Lawn, Teaneck, Fort Lee and more</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><Link to="/locations/passaic-county" className="font-semibold text-foreground hover:underline">Passaic County</Link> – Clifton, Wayne, Passaic, Totowa and surrounding towns</span>
              </li>
            </ul>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><Link to="/locations/morris-county" className="font-semibold text-foreground hover:underline">Morris County</Link> – Morristown, Parsippany, Denville, Rockaway and nearby areas</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><Link to="/locations/hudson-county" className="font-semibold text-foreground hover:underline">Hudson County</Link> – Jersey City, Hoboken, Bayonne and surrounding neighborhoods</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <Link to="/locations" className="text-primary hover:underline font-medium">
              View all SmartReno service areas →
            </Link>
          </div>
        </div>
      </section>

      {/* Project Types & Budget Ranges Section */}
      <section aria-labelledby="project-types-heading" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 id="project-types-heading" className="text-3xl md:text-4xl font-bold mb-4">Projects SmartReno Helps You Manage</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Kitchens</strong> – typically from $25K–$100K+ depending on size, layout and finishes</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Bathrooms</strong> – from $15K–$50K+ based on scope and materials</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Basement remodels and conversions</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Interior & exterior home remodeling</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Additions, dormers and major expansions</strong></span>
              </li>
            </ul>
            <p className="text-lg text-muted-foreground text-center">
              Our estimators help you scope the work, understand cost drivers and compare bids so you can make the right decision for your home and budget.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose SmartReno */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Homeowners Choose SmartReno</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Estimate Section */}
      <section id="free-estimate" className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Free, No-Obligation Estimate</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Your SmartReno estimate visit is completely free. There's no charge to have an estimator review your project, take measurements, and help define your scope. You only pay your contractor if you decide to move forward with a project.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>No upfront fees or credit card required</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>No obligation to choose a contractor</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Use your estimate to compare options confidently</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              <img 
                src={exteriorRenovation} 
                alt="Professional exterior home renovation with new siding, roof, and windows in Northern New Jersey" 
                className="rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">SmartReno vs Finding Contractors On Your Own</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-card border rounded-lg">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold bg-primary/10">SmartReno</th>
                  <th className="text-center p-4 font-semibold">Doing It Yourself</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Free on-site estimate</td>
                  <td className="text-center p-4 bg-primary/5">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                    <span className="text-sm block mt-1">Included</span>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-destructive mx-auto" />
                    <span className="text-sm block mt-1">Usually paid or vague</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Vetted, insured contractors</td>
                  <td className="text-center p-4 bg-primary/5">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                    <span className="text-sm block mt-1">Pre-screened</span>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-destructive mx-auto" />
                    <span className="text-sm block mt-1">Must research each yourself</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Organized, comparable bids</td>
                  <td className="text-center p-4 bg-primary/5">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                    <span className="text-sm block mt-1">Structured proposals</span>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-destructive mx-auto" />
                    <span className="text-sm block mt-1">Different formats/prices</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Central messaging & project hub</td>
                  <td className="text-center p-4 bg-primary/5">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                    <span className="text-sm block mt-1">One platform</span>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-destructive mx-auto" />
                    <span className="text-sm block mt-1">Texts, emails, calls</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4">Support throughout the project</td>
                  <td className="text-center p-4 bg-primary/5">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                    <span className="text-sm block mt-1">SmartReno oversight</span>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-destructive mx-auto" />
                    <span className="text-sm block mt-1">You manage everything</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Project Showcase Gallery */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transform Your Northern NJ Home</h2>
            <p className="text-lg text-muted-foreground">Quality renovations for every space in your home</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={exteriorRenovation} 
                alt="Exterior home renovation with new roof, siding, windows and doors in Northern NJ" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Exterior Renovations</h3>
                  <p className="text-sm opacity-90">Transform your home's curb appeal</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={kitchenRemodel} 
                alt="Modern kitchen remodel with white cabinets, quartz countertops and stainless appliances" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Kitchen Remodels</h3>
                  <p className="text-sm opacity-90">Modern, functional kitchen spaces</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={bathroomUpgrade} 
                alt="Luxury bathroom renovation with modern tile, walk-in shower and dual vanity" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Bathroom Upgrades</h3>
                  <p className="text-sm opacity-90">Spa-like retreats in your home</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={basementLiving} 
                alt="Finished basement living space with recessed lighting and entertainment area" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Basement Finishing</h3>
                  <p className="text-sm opacity-90">Add valuable living space</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={homeAddition} 
                alt="Home addition and room extension construction showing quality craftsmanship" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Home Additions</h3>
                  <p className="text-sm opacity-90">Expand your living space</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-lg group">
              <img 
                src={wholeHomeReno} 
                alt="Complete whole-home renovation transformation with modern finishes and open floor plan" 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">Whole-Home Renovations</h3>
                  <p className="text-sm opacity-90">Complete transformations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estimate Form */}
      <section id="estimate-form" className="py-16 md:py-24 bg-secondary/30">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Request Your Free Estimate</h2>
            <p className="text-lg text-muted-foreground">Tell us about your project and we'll get back to you within 24 hours</p>
          </div>

          <form onSubmit={onSubmit} className="bg-card border rounded-lg p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formState.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  value={formState.zip}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Type *</label>
              <select
                name="project_type"
                value={formState.project_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                {projectTypes.map((project) => (
                  <option key={project.type} value={project.type}>{project.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Tell us about your project..."
              />
            </div>

            {status.msg && (
              <div className={`p-4 rounded-md ${status.ok ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {status.msg}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Get My Free Estimate"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By submitting this form, you agree to be contacted about your project. No spam, ever.
            </p>
          </form>
        </div>
      </section>

      {/* Homeowner FAQ Section */}
      <section id="faq" aria-labelledby="homeowner-faq-heading" className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 id="homeowner-faq-heading" className="text-3xl md:text-4xl font-bold mb-4">Homeowner FAQs</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-card border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  <h3 className="text-base font-semibold">{faq.question}</h3>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Renovation?</h2>
          <p className="text-lg mb-8 opacity-90">
            Tell us about your project and get a free, no-obligation estimate visit from a SmartReno estimator.
          </p>
          <Button size="lg" variant="secondary" onClick={() => scrollToSection("estimate-form")}>
            Start My Free Estimate
          </Button>
        </div>
      </section>

      {/* Floating CTA Button */}
      {showFloatingButton && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button size="lg" onClick={() => scrollToSection("estimate-form")} className="shadow-lg">
            Get Free Estimate
          </Button>
          </div>
        )}

      <SiteFooter />
      
      <AIChatBubble />
    </div>
  );
}
