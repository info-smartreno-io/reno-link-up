import { Link } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ClipboardList,
  Search,
  FileText,
  Users,
  Hammer,
  Shield,
  CheckCircle2,
  MessageSquare,
  Home,
} from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Home,
    title: "Project Planning",
    description: "Tell us about your renovation — what rooms, what work, your goals and timeline.",
    detail: "Our guided intake captures everything needed to scope your project properly.",
  },
  {
    step: "02",
    icon: Search,
    title: "On-Site Walkthrough",
    description: "A SmartReno construction agent visits your home to evaluate scope and take detailed measurements.",
    detail: "This hands-on step ensures nothing is missed before scoping begins.",
  },
  {
    step: "03",
    icon: FileText,
    title: "Scope Development",
    description: "We create a detailed scope of work with trade-by-trade breakdowns, material selections, and specifications.",
    detail: "Every contractor bids on the exact same scope — so you can compare apples to apples.",
  },
  {
    step: "04",
    icon: ClipboardList,
    title: "Contractor Bidding",
    description: "We compile your scope into a professional bid packet and invite vetted, licensed contractors to submit proposals.",
    detail: "All contractors are verified for licensing, insurance, and work quality.",
  },
  {
    step: "05",
    icon: Users,
    title: "Proposal Review",
    description: "You review structured proposals side-by-side, with clear pricing breakdowns and contractor qualifications.",
    detail: "No guesswork — just transparent, comparable bids on identical scope.",
  },
  {
    step: "06",
    icon: Shield,
    title: "Pre-Construction Alignment",
    description: "Once you select a contractor, we align on timeline, milestones, and communication expectations.",
    detail: "Everything is documented before the first day of construction.",
  },
  {
    step: "07",
    icon: Hammer,
    title: "Project Execution",
    description: "Your renovation is managed through SmartReno with clear milestones, communication, and documentation.",
    detail: "No surprises. No miscommunication. Just a well-run renovation.",
  },
];

const PROTECTIONS = [
  { icon: ClipboardList, label: "Detailed Scope of Work" },
  { icon: Shield, label: "Verified Contractors" },
  { icon: MessageSquare, label: "Centralized Communication" },
  { icon: FileText, label: "Change Order Tracking" },
  { icon: CheckCircle2, label: "Milestone Management" },
  { icon: Search, label: "Budget Transparency" },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-medium text-background/80 mb-6">
              <Shield className="h-3.5 w-3.5" />
              SmartReno Process
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              The First Step<br />Before You Renovate
            </h1>
            <p className="text-lg md:text-xl text-background/70 max-w-2xl mb-4 leading-relaxed">
              SmartReno protects your time, money and home by structuring your renovation before construction begins.
            </p>
            <p className="text-base text-background/50 max-w-xl mb-8">
              Most renovation problems start before the first nail is driven. We fix that.
            </p>
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8">
              <Link to="/start-your-renovation">
                Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 md:py-28 border-b border-border/50">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Why Most Renovations Go Wrong
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
            80% of renovation problems — budget overruns, timeline delays, contractor disputes — happen because the project was never properly scoped before work began. Homeowners get multiple bids on different scopes, can't compare them, and end up choosing on price alone.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: "63%", label: "of renovations go over budget" },
              { stat: "2-3×", label: "longer than homeowners expect" },
              { stat: "#1", label: "cause: undefined scope of work" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 bg-card p-6">
                <p className="text-3xl font-bold text-foreground mb-2">{item.stat}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How SmartReno Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five clear steps from idea to construction — with protection at every stage.
            </p>
          </div>
          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <div
                key={step.step}
                className={`flex flex-col md:flex-row items-start gap-8 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="md:w-1/2">
                  <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/20 p-10 flex items-center justify-center min-h-[200px]">
                    <step.icon className="h-20 w-20 text-foreground/10" />
                  </div>
                </div>
                <div className="md:w-1/2 flex flex-col justify-center">
                  <div className="text-sm font-bold text-muted-foreground/50 mb-2">STEP {step.step}</div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                  <p className="text-sm text-muted-foreground/70 italic">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protections */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built-In Protection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              SmartReno protects your time, money and home at every stage of the process.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {PROTECTIONS.map((p) => (
              <div key={p.label} className="text-center">
                <div className="h-14 w-14 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                  <p.icon className="h-7 w-7 text-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Renovate the Right Way?</h2>
          <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
            Start with a free project scope. Tell us about your renovation and we'll structure it before construction begins.
          </p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-10">
            <Link to="/start-your-renovation">
              Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
