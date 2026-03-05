import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, ArrowRight, ClipboardList, ShieldCheck, LayoutDashboard, FileText, Users, Hammer } from "lucide-react";
import { motion } from "framer-motion";
import { SiteNavbar } from "@/components/SiteNavbar";
import { LaunchBanner } from "@/components/LaunchBanner";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { AIChatBubble } from "@/components/website/AIChatBubble";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { trackEvent } from "@/utils/analytics";
import constructionHero from "@/assets/construction-hero.jpg";
import kitchenReno from "@/assets/kitchen-reno.jpg";
import bathroomConstruction from "@/assets/bathroom-construction.jpg";
import basementFinished from "@/assets/basement-finished.jpg";

export default function Index() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchProjectType, setSearchProjectType] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [contractorTrade, setContractorTrade] = useState("");
  const [contractorZip, setContractorZip] = useState("");

  useScrollTracking();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        if (roleData?.role) setUserRole(roleData.role);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
      if (!session?.user) setUserRole(null);
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

  const handleProjectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchProjectType) params.set("type", searchProjectType);
    if (searchZip) params.set("zip", searchZip);
    navigate(`/start-your-renovation?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-background" style={{ scrollBehavior: "smooth" }}>
      <Helmet>
        <title>SmartReno – The First Step Before You Renovate | Northern NJ</title>
        <meta name="description" content="SmartReno structures renovation projects before construction begins — helping protect your time, money, and home. Serving Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SmartReno – The First Step Before You Renovate" />
        <meta property="og:description" content="SmartReno structures renovation projects before construction begins — helping protect your time, money, and home." />
        <meta property="og:url" content="https://smartreno.io/" />
        <meta property="og:site_name" content="SmartReno" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SmartReno",
            "url": "https://smartreno.io/",
            "description": "SmartReno structures renovation projects before construction begins — helping protect your time, money, and home."
          })}
        </script>
      </Helmet>

      <SiteNavbar />

      {/* ===== HERO SECTION ===== */}
      <section className="py-16 md:py-24" aria-label="Hero section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              The First Step Before You Renovate
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              SmartReno structures renovation projects before construction begins — helping protect your time, money, and home.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="text-base"
                onClick={() => {
                  trackEvent("homepage_cta_click", { cta_location: "hero", cta_text: "Start Your Project" });
                  navigate("/start-your-renovation");
                }}
              >
                Start Your Project <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/contractors/join">Join Contractor Network</Link>
              </Button>
              {isLoggedIn && (
                <Button size="lg" variant="secondary" onClick={() => navigate(getDashboardPath())} className="text-base">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  View Dashboard
                </Button>
              )}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={constructionHero}
              alt="Professional home renovation consultation in Northern New Jersey"
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


      {/* ===== LAUNCH BANNER ===== */}
      <LaunchBanner />

      {/* ===== HOW SMARTRENO WORKS ===== */}
      <section id="how-it-works" className="py-16 md:py-20 bg-background" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="how-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">How SmartReno Works</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { idx: 1, title: "Submit Your Project", icon: ClipboardList, desc: "Share your renovation goals, budget, and timeline. It takes less than 60 seconds." },
              { idx: 2, title: "Structured Project Scope", icon: FileText, desc: "We create a clear, detailed scope of work so every contractor bids on the same thing." },
              { idx: 3, title: "Contractors Submit Bids", icon: Users, desc: "Vetted local contractors review your scope and submit competitive proposals." },
              { idx: 4, title: "Start Construction", icon: Hammer, desc: "Choose your contractor with confidence and begin your renovation with support." },
            ].map((step) => (
              <motion.div
                key={step.idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: step.idx * 0.05 }}
                className="rounded-2xl border p-6 bg-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Step {step.idx}</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="py-16 md:py-20 bg-muted/20 border-y" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 id="trust-heading" className="text-3xl sm:text-4xl font-bold text-center mb-12">
            We Protect Your Time, Money, and Home
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Fewer contractor calls", desc: "One intake reaches multiple vetted contractors — no need to repeat yourself." },
              { title: "Structured scopes before bidding", desc: "Every contractor bids on the same detailed scope, so proposals are truly comparable." },
              { title: "Easier proposal comparison", desc: "Side-by-side bid comparisons with estimator guidance help you choose with confidence." },
              { title: "Experienced contractors following proper practices", desc: "Licensed, insured professionals who follow industry standards and local codes." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROJECT SHOWCASE ===== */}
      <section className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Popular Renovation Projects</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From kitchens to basements, we help Northern NJ homeowners bring their vision to life
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: kitchenReno, alt: "Kitchen remodel Northern NJ", title: "Kitchen Remodeling", price: "Complete renovations from $30k–$150k+" },
              { img: bathroomConstruction, alt: "Bathroom renovation Northern NJ", title: "Bathroom Remodeling", price: "Modern updates starting at $15k" },
              { img: basementFinished, alt: "Finished basement Northern NJ", title: "Basement Finishing", price: "Add living space from $40k–$100k+" },
            ].map((proj) => (
              <div key={proj.title} className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={proj.img}
                    alt={proj.alt}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{proj.title}</h3>
                    <p className="text-sm opacity-90">{proj.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What Homeowners Are Saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { initials: "TC", name: "Thomas & Cynthia", loc: "Mahwah, NJ", quote: "SmartReno made our kitchen renovation so much easier. Having one estimator come out and then getting multiple bids was perfect." },
              { initials: "SM", name: "Sarah M.", loc: "Ridgewood, NJ", quote: "Great experience from start to finish. The contractor we chose through SmartReno was professional and completed our bathroom on time." },
              { initials: "JR", name: "John R.", loc: "Wayne, NJ", quote: "Finally, a renovation platform that actually helps instead of just collecting your info. The free estimate was detailed and accurate." },
            ].map((t) => (
              <Card key={t.initials}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => <span key={i} className="text-yellow-500">⭐</span>)}
                  </div>
                  <p className="text-sm mb-4">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">{t.initials}</div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.loc} • Verified Homeowner</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "How does SmartReno make money?", a: "Contractors pay a small service fee when they win projects through our platform. Homeowners never pay for estimates or to use SmartReno." },
              { q: "Is the estimate really free?", a: "Yes. A SmartReno estimator visits your home, measures, and creates a detailed project scope at no charge to you." },
              { q: "What if I don't like any of the contractor bids?", a: "No problem. There's zero obligation. You can walk away or ask us to find additional contractors." },
              { q: "What areas do you serve?", a: "Currently Bergen, Passaic, Morris, Essex, and Hudson counties in Northern New Jersey, with plans to expand soon." },
              { q: "What project sizes do you handle?", a: "SmartReno works with projects ranging from $10,000 to $100,000+. Kitchen remodels, bathrooms, basements, additions, and more." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-accent/10 to-primary/10 border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Start Your Renovation the Smarter Way
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Answer a few quick questions and get matched with vetted contractors and clear pricing options for your renovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => navigate("/start-your-renovation")}>
              Start Your Project <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/contractors/join">Join Contractor Network</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Questions? Email{" "}
            <a href="mailto:info@smartreno.io" className="underline hover:text-accent transition-colors">info@smartreno.io</a>
          </p>
        </div>
      </section>

      {/* ===== CONTRACTOR SEARCH BAR ===== */}
      <section className="py-10 bg-muted/30 border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-6">Find a Contractor</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (contractorTrade) params.set("trade", contractorTrade);
              if (contractorZip) params.set("zip", contractorZip);
              navigate(`/contractors?${params.toString()}`);
            }}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-1.5 block">Trade Category</label>
              <Select value={contractorTrade} onValueChange={setContractorTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Contractor</SelectItem>
                  <SelectItem value="kitchen">Kitchen Specialist</SelectItem>
                  <SelectItem value="bathroom">Bathroom Specialist</SelectItem>
                  <SelectItem value="basement">Basement Finishing</SelectItem>
                  <SelectItem value="addition">Home Additions</SelectItem>
                  <SelectItem value="exterior">Exterior / Roofing</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <label className="text-sm font-medium mb-1.5 block">ZIP Code</label>
              <Input
                placeholder="07450"
                value={contractorZip}
                onChange={(e) => setContractorZip(e.target.value)}
                maxLength={5}
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto whitespace-nowrap">
              Search Contractors
            </Button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 pt-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-5 text-sm mb-12">
            <div>
              <div className="font-semibold">SmartReno</div>
              <p className="mt-2 text-muted-foreground mb-3">The first step before you renovate.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/locations/bergen-county" className="hover:underline">Bergen County</Link></li>
                <li><Link to="/locations/passaic-county" className="hover:underline">Passaic County</Link></li>
                <li><Link to="/locations/morris-county" className="hover:underline">Morris County</Link></li>
                <li><Link to="/locations/essex-county" className="hover:underline">Essex County</Link></li>
                <li><Link to="/locations/hudson-county" className="hover:underline">Hudson County</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Platform</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="#how-it-works">How it works</a></li>
                <li><Link to="/software" className="hover:underline">Software</Link></li>
                <li><Link to="/homeowners" className="hover:underline">Homeowners</Link></li>
                <li><Link to="/contractors" className="hover:underline">Contractors</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Resources</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="https://jersey-digs-data.lovable.app/pro-calculator">SmartReno Calculator</a></li>
                <li><a className="hover:underline" href="https://jersey-digs-data.lovable.app/financing">Financing</a></li>
                <li><Link to="/blog" className="hover:underline">Blog</Link></li>
                <li><Link to="/locations" className="hover:underline">Service Locations</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Company</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:underline">About</Link></li>
                <li><Link to="/projects" className="hover:underline">Projects</Link></li>
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
    </main>
  );
}
