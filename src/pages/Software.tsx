import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, FileText, Users, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";

export default function Software() {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>SmartReno Software – Renovation Project Management Platform</title>
        <meta name="description" content="SmartReno's platform helps manage renovation projects from intake to completion — structured scopes, bid management, and contractor coordination." />
        <link rel="canonical" href="https://smartreno.io/software" />
      </Helmet>

      <SiteNavbar />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Renovation Management, Built for Results
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SmartReno's platform connects homeowners, estimators, designers, architects, vendors, and contractors — structuring every renovation from scope to completion.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Structured Scopes", desc: "Detailed project scopes ensure every contractor bids on the same work — reducing change orders and confusion." },
              { icon: Users, title: "Contractor Matching", desc: "Vetted local contractors are matched to projects based on trade, location, budget, and availability." },
              { icon: BarChart3, title: "Bid Comparison", desc: "Side-by-side proposal comparison with estimator guidance helps homeowners choose with confidence." },
              { icon: LayoutDashboard, title: "Project Dashboard", desc: "Track project progress, communicate with your team, and manage documents in one place." },
              { icon: ShieldCheck, title: "Quality Assurance", desc: "Tracked walkthroughs, photo documentation, and milestone tracking keep projects on course." },
              { icon: FileText, title: "Document Management", desc: "Contracts, blueprints, permits, and photos — organized and accessible throughout the project." },
            ].map((feature) => (
              <Card key={feature.title} className="border-2">
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent grid place-items-center mb-6">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-accent/10 to-primary/10 border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're a homeowner planning a renovation or a contractor looking for quality leads, SmartReno has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/start-your-renovation">Start Your Project <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/contractors/join">Join Contractor Network</Link>
            </Button>
          </div>
        </div>
      </section>

      <FooterAdminLogin />
    </main>
  );
}
