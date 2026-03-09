import { Link } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  TrendingUp,
  Shield,
  Users,
  FileText,
  CheckCircle2,
  ArrowRight,
  Star,
  DollarSign,
  Calendar,
} from "lucide-react";

const BENEFITS = [
  {
    icon: ClipboardList,
    title: "Pre-Scoped Projects",
    description: "Every project comes with a detailed scope of work, material selections, and budget range — no more guessing games.",
  },
  {
    icon: DollarSign,
    title: "Qualified Homeowners",
    description: "Homeowners on SmartReno have been pre-qualified and are ready to move forward. No tire-kickers.",
  },
  {
    icon: FileText,
    title: "Structured Bid Packets",
    description: "Bid on organized trade-by-trade packets so you can price accurately and win more jobs.",
  },
  {
    icon: Shield,
    title: "Protected Reputation",
    description: "Your verified license, insurance, and reviews are showcased to homeowners looking for trusted pros.",
  },
  {
    icon: Calendar,
    title: "Streamlined Scheduling",
    description: "Coordinate site visits, project timelines, and milestones through one platform.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Access a steady pipeline of residential renovation projects in Northern New Jersey.",
  },
];

const STEPS = [
  { step: "01", title: "Apply & Get Verified", description: "Submit your license, insurance, and portfolio. Our team verifies your credentials." },
  { step: "02", title: "Receive Bid Invitations", description: "Get matched with pre-scoped projects in your trade and service area." },
  { step: "03", title: "Submit Your Bid", description: "Price the structured bid packet and submit your proposal through the platform." },
  { step: "04", title: "Win & Build", description: "Get selected by homeowners and manage your project with SmartReno tools." },
];

export default function ForContractors() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-medium text-background/80 mb-6">
              <Star className="h-3.5 w-3.5" />
              SmartReno Contractor Network
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Better Projects.<br />Better Process.<br />Better Business.
            </h1>
            <p className="text-lg md:text-xl text-background/70 max-w-2xl mb-8 leading-relaxed">
              Join SmartReno's vetted contractor network and receive pre-scoped, qualified renovation projects in Northern New Jersey. No cold leads — just structured opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8">
                <Link to="/contractors/join">
                  Apply to Join <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-background/30 text-background hover:bg-background/10 text-base px-8">
                <Link to="/contractors">View Our Network</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Pre-Scoped Projects" },
              { value: "3", label: "Bids Per Project" },
              { value: "NNJ", label: "Service Area" },
              { value: "Free", label: "To Join" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Contractors Choose SmartReno
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We handle the scoping, qualification, and organization — so you can focus on what you do best: building.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-2xl border border-border/50 bg-card p-8 hover:border-foreground/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-5 group-hover:bg-foreground/10 transition-colors">
                  <benefit.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works for Contractors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From application to project completion in four simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-5xl font-black text-foreground/5 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The SmartReno Difference */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Not a Lead Gen Platform
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                SmartReno is different. We don't sell leads. We structure projects before they reach you — with detailed scopes, material selections, and qualified homeowners who are ready to build.
              </p>
              <ul className="space-y-4">
                {[
                  "Every project is scoped by a construction estimator",
                  "Homeowners are pre-qualified before bidding begins",
                  "You only bid on projects that match your trade & area",
                  "No subscription fees — it's free to join the network",
                  "Your profile showcases your license, insurance & work",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/20 p-10 text-center">
              <Users className="h-16 w-16 text-foreground/20 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-3">Join 50+ Contractors</h3>
              <p className="text-muted-foreground mb-6">
                Licensed, insured professionals building across Northern New Jersey.
              </p>
              <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8">
                <Link to="/contractors/join">
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
            Apply to the SmartReno contractor network today. It's free, and you could start receiving bid invitations within days.
          </p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-10">
            <Link to="/contractors/join">
              Apply to Join the Network <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
