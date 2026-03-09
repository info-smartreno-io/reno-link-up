import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AIChatBubble } from "@/components/website/AIChatBubble";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { trackEvent } from "@/utils/analytics";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  FileText,
  Users,
  Hammer,
  Shield,
  Lightbulb,
  BarChart3,
  Handshake,
  CheckCircle,
  Home,
  Bath,
  ChefHat,
  PlusSquare,
  Building2,
  TreePine,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function Index() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
      if (!session?.user) setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>SmartReno – Plan Your Renovation the Smart Way | Northern NJ</title>
        <meta name="description" content="SmartReno organizes your renovation before construction begins with clearer scope, renovation cost insight, and structured contractor proposals. Serving Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SmartReno – Plan Your Renovation the Smart Way" />
        <meta property="og:description" content="SmartReno organizes your renovation before construction begins with clearer scope, renovation cost insight, and structured contractor proposals." />
        <meta property="og:url" content="https://smartreno.io/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SmartReno",
            "url": "https://smartreno.io/",
            "description": "SmartReno structures renovation projects before construction begins."
          })}
        </script>
      </Helmet>

      <MarketingNavbar />

      {/* ===== 2. HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-background to-accent/5" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl -translate-y-1/2 translate-x-1/3" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Copy */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08]">
                The First Step{" "}
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  Before You Renovate
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                SmartReno organizes your renovation before construction begins so homeowners can move forward with clarity, confidence, and the right professionals.
              </p>
              <p className="mt-3 text-base font-semibold text-foreground/80">
                We protect your time, money and home.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    trackEvent("homepage_cta_click", { cta_location: "hero", cta_text: "Start Your Project" });
                    navigate("/start-your-renovation");
                  }}
                  className="rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground hover:bg-accent transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  Start Your Project <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/property-renovation-report"
                  className="rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground hover:bg-accent transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  Analyze Your Property
                </Link>
              </div>

              <Link
                to="/contractors/join"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Join the Contractor Network <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
                {["Structured project planning", "Experienced contractors", "Built for Northern NJ"].map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right - Platform Preview (cards stack) */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative space-y-4">
                {/* Card 1: Dashboard preview */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 grid place-items-center">
                      <BarChart3 className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-semibold">Project Dashboard</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2.5 bg-muted rounded-full w-full" />
                    <div className="h-2.5 bg-muted rounded-full w-4/5" />
                    <div className="h-2.5 bg-accent/20 rounded-full w-3/5" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["Scope", "Budget", "Timeline"].map((label) => (
                      <div key={label} className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="text-sm font-semibold mt-1">✓</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Property Report */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg ml-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-success/10 grid place-items-center">
                      <Home className="h-3.5 w-3.5 text-success" />
                    </div>
                    <span className="text-xs font-semibold">Property Evaluation</span>
                    <span className="ml-auto text-xs text-success font-medium">Ready</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 bg-success/30 rounded-full flex-1" />
                    <div className="h-2 bg-accent/20 rounded-full flex-1" />
                    <div className="h-2 bg-muted rounded-full flex-1" />
                  </div>
                </div>

                {/* Card 3: Contractor Proposal */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg mr-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 grid place-items-center">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold">Contractor Proposals</span>
                    <span className="ml-auto text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">3 bids</span>
                  </div>
                  <div className="space-y-2">
                    {[85, 92, 78].map((score, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-muted" />
                        <div className="h-2 bg-muted rounded-full flex-1" />
                        <span className="text-xs font-medium text-muted-foreground">{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 3. SOCIAL PROOF / TRUST ===== */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Structured Planning", icon: ClipboardList },
              { label: "Property Intelligence", icon: BarChart3 },
              { label: "Proposal Workflows", icon: FileText },
              { label: "Scope Organization", icon: Lightbulb },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 grid place-items-center">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. HOW SMARTRENO WORKS ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              The Process
            </motion.p>
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              How SmartReno Works
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: 1, title: "Submit Project Details", icon: ClipboardList, desc: "Share your renovation goals, budget, and timeline in under 60 seconds." },
              { step: 2, title: "On-Site Walkthrough", icon: Eye, desc: "Our estimator visits your home to evaluate scope and take detailed measurements." },
              { step: 3, title: "Scope Development", icon: FileText, desc: "We create a clear, detailed scope so every contractor bids on the same work." },
              { step: 4, title: "Contractor Proposals", icon: Users, desc: "Vetted local contractors review your scope and submit competitive proposals." },
              { step: 5, title: "Start Construction", icon: Hammer, desc: "Choose your contractor with confidence and begin your renovation." },
            ].map(({ step, title, icon: Icon, desc }) => (
              <motion.div
                key={step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={step}
                className="relative rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:border-accent/30 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Step {step}</span>
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. WHY SMARTRENO ===== */}
      <section className="py-24 md:py-32 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Why SmartReno</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Renovations work better when the process is structured
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Clear project scope", desc: "Every renovation starts with a detailed scope of work before any bids.", icon: FileText },
              { title: "Better renovation planning", desc: "Structure your project before spending a dollar on construction.", icon: Lightbulb },
              { title: "Organized contractor proposals", desc: "Side-by-side bid comparisons on identical scopes for true comparison.", icon: Users },
              { title: "Property-specific insight", desc: "Renovation recommendations tailored to your property's characteristics.", icon: BarChart3 },
              { title: "Less back-and-forth", desc: "One intake reaches multiple vetted contractors. No repeating yourself.", icon: Handshake },
              { title: "More confidence", desc: "Licensed, insured professionals following industry standards.", icon: Shield },
            ].map(({ title, desc, icon: Icon }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-border/50 bg-card p-8 hover:shadow-md transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-accent/10 grid place-items-center mb-5">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. PROPERTY EVALUATION FEATURE ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Property Intelligence</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                See what renovations make sense for your property
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Use SmartReno's property renovation evaluation tools to explore renovation opportunities, cost ranges, and potential value impact before moving forward.
              </p>
              <Link
                to="/property-renovation-report"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground hover:bg-accent transition-all shadow-lg shadow-primary/20"
              >
                Analyze Your Property <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Visual */}
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-success/10 grid place-items-center">
                  <Home className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Property Report</div>
                  <div className="text-xs text-muted-foreground">123 Oak Street, Ridgewood NJ</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Kitchen Remodel", range: "$45k – $110k", color: "bg-accent" },
                  { label: "Bathroom Remodel", range: "$15k – $45k", color: "bg-primary" },
                  { label: "Basement Finish", range: "$40k – $85k", color: "bg-success" },
                ].map(({ label, range, color }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color}/30 rounded-full w-3/4`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. RENOVATION COST INTELLIGENCE ===== */}
      <section className="py-24 md:py-32 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Cost Intelligence</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Real renovation cost insight for Northern New Jersey
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Kitchen Remodel", range: "$30k – $150k+", icon: ChefHat, link: "/kitchen-remodel-cost-nj" },
              { title: "Bathroom Remodel", range: "$15k – $60k+", icon: Bath, link: "/bathroom-remodel-cost-nj" },
              { title: "Basement Remodel", range: "$40k – $100k+", icon: Building2, link: "/basement-remodel-cost-nj" },
              { title: "Home Addition", range: "$80k – $300k+", icon: PlusSquare, link: "/home-addition-cost-nj" },
            ].map(({ title, range, icon: Icon, link }) => (
              <Link
                key={title}
                to={link}
                className="group rounded-2xl border border-border/50 bg-card p-8 hover:shadow-lg hover:border-accent/30 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center mb-5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Icon className="h-6 w-6 text-accent group-hover:text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{range}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View costs <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/renovation-costs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Explore all renovation costs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 8. EXAMPLE RENOVATION PROJECTS ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Real Projects</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Recent renovation projects
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: "Kitchen Renovation", budget: "$78,000", scope: "Complete gut renovation with custom cabinetry and quartz countertops", location: "Ridgewood, NJ" },
              { type: "Basement Remodel", budget: "$62,000", scope: "Full basement finish with home theater, wet bar, and bathroom", location: "Wayne, NJ" },
              { type: "Home Addition", budget: "$185,000", scope: "Second-story addition with master suite and two bedrooms", location: "Glen Rock, NJ" },
              { type: "Bathroom Renovation", budget: "$34,000", scope: "Primary bath renovation with heated floors and frameless glass", location: "Montclair, NJ" },
            ].map(({ type, budget, scope, location }) => (
              <div key={type} className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-2 bg-gradient-to-r from-accent to-primary" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">{type}</span>
                  </div>
                  <div className="text-2xl font-bold mb-3">{budget}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{scope}</p>
                  <span className="text-xs text-muted-foreground">{location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. CONTRACTOR NETWORK ===== */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Contractors</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Connect with experienced renovation professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              SmartReno connects homeowners with qualified contractors who can review structured project scopes and submit proposals.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { name: "ABC Construction", trade: "General Contractor", rating: "4.9", projects: "47" },
              { name: "Premier Kitchens", trade: "Kitchen Specialist", rating: "4.8", projects: "32" },
              { name: "Modern Baths NJ", trade: "Bathroom Renovation", rating: "4.7", projects: "28" },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 grid place-items-center text-accent font-bold text-sm">
                    {c.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.trade}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">★ {c.rating}</span>
                  <span className="text-muted-foreground">{c.projects} projects</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/contractors"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background hover:bg-foreground/90 transition-all"
            >
              Browse Contractors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 9B. DESIGNERS ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Designers</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Work with designers who specialize in renovation planning
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Design professionals can collaborate with homeowners early in the renovation process to develop layouts, selections, and project concepts.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/designers"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition-all"
            >
              Browse Designers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 10. FAQ ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Common questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "How is SmartReno different from hiring a contractor directly?", a: "SmartReno creates a detailed project scope before contractors bid, so every proposal is based on identical work. You get structured comparisons instead of guesswork." },
              { q: "Do I need to pay before receiving proposals?", a: "No. SmartReno provides an on-site walkthrough, scope development, and contractor proposals at no cost to homeowners." },
              { q: "What types of renovations does SmartReno support?", a: "Kitchen remodels, bathroom renovations, basement finishing, home additions, whole-home renovations, and more. Projects ranging from $10,000 to $500,000+." },
              { q: "How do contractors join the platform?", a: "Licensed, insured contractors can apply through our network. We verify credentials and onboard qualified professionals." },
              { q: "Does SmartReno perform construction work?", a: "No. SmartReno organizes and structures the renovation process. Construction is performed by independent licensed contractors in our network." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-5 data-[state=open]:shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== 11. FINAL CTA ===== */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-muted/20 to-primary/5" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Renovations work better when the process is structured
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start with better planning, clearer scope, and a smarter path to construction.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/start-your-renovation")}
              className="rounded-full bg-foreground px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 flex items-center gap-2 justify-center"
            >
              Start Your Project <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/property-renovation-report"
              className="rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-accent transition-all shadow-lg shadow-primary/20 flex items-center gap-2 justify-center"
            >
              Analyze Your Property
            </Link>
          </div>

          <Link
            to="/contractors/join"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Join the Contractor Network <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ===== 12. FOOTER ===== */}
      <MarketingFooter />
      <AIChatBubble />
    </main>
  );
}
