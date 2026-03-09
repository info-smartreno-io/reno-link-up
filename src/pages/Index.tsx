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
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-accent/90 to-primary">
        {/* Decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.4),transparent_60%)]" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/40 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-foreground/70 mb-6">
              The First Step Before You Renovate
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] text-accent-foreground">
              Vetted Contractors,{" "}
              <span className="block sm:inline">Qualified Bids</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-accent-foreground/75 max-w-2xl mx-auto leading-relaxed">
              SmartReno protects your time, money and home. We scope your project, then vetted contractors provide accurate pricing — you receive 3 qualified bids.
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-accent-foreground/70">
              {[
                { icon: CheckCircle, label: "Vetted & Verified" },
                { icon: Shield, label: "Licensed & Insured" },
                { icon: Users, label: "3 Bids Per Project" },
                { icon: Eye, label: "Free Scoping Visit" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mt-10 flex justify-center">
              <div className="flex bg-background rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl">
                <select className="flex-1 px-5 py-4 text-sm text-foreground border-r border-border bg-background focus:outline-none">
                  <option>All Trades</option>
                  <option>General Contractor</option>
                  <option>Kitchen Remodel</option>
                  <option>Bathroom Remodel</option>
                  <option>Home Addition</option>
                  <option>Basement Finishing</option>
                </select>
                <input
                  type="text"
                  placeholder="ZIP Code"
                  className="w-32 sm:w-40 px-5 py-4 text-sm text-foreground bg-background focus:outline-none"
                />
                <button
                  onClick={() => navigate("/contractors")}
                  className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-4 text-sm font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </motion.div>
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
              Renovations work better when organized
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
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
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
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">For Contractors</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Work with homeowners who are ready to renovate
              </h2>
              <p className="mt-6 text-lg text-background/60 leading-relaxed max-w-lg">
                SmartReno provides structured renovation opportunities and transparent proposal workflows for experienced contractors.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Qualified homeowner projects",
                  "Structured project scopes",
                  "Transparent proposal workflow",
                  "Professional visibility on the platform",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-background/80">
                    <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/contractors/join"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-base font-semibold text-foreground hover:bg-background/90 transition-all"
              >
                Join the Contractor Network <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Contractor cards visual */}
            <div className="space-y-4">
              {[
                { name: "ABC Construction", trade: "General Contractor", rating: "4.9", projects: "47" },
                { name: "Premier Kitchens", trade: "Kitchen Specialist", rating: "4.8", projects: "32" },
                { name: "Modern Baths NJ", trade: "Bathroom Renovation", rating: "4.7", projects: "28" },
              ].map((c) => (
                <div key={c.name} className="rounded-xl border border-background/10 bg-background/5 p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background/10 grid place-items-center text-background font-bold text-sm">
                    {c.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-background">{c.name}</div>
                    <div className="text-xs text-background/50">{c.trade}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-background">★ {c.rating}</div>
                    <div className="text-xs text-background/50">{c.projects} projects</div>
                  </div>
                </div>
              ))}
            </div>
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
              className="rounded-xl bg-foreground px-8 py-4 text-base font-semibold text-background hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 flex items-center gap-2 justify-center"
            >
              Start Your Project <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/property-renovation-report"
              className="rounded-xl border-2 border-border px-8 py-4 text-base font-semibold text-foreground hover:bg-muted transition-all flex items-center gap-2 justify-center"
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
