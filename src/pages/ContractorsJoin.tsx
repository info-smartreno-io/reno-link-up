import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Users, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";

export default function ContractorsJoin() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Join SmartReno Contractor Network – Northern NJ</title>
        <meta name="description" content="Join SmartReno's vetted contractor network. Get matched with qualified homeowner leads in Bergen, Passaic, Morris & Hudson counties." />
        <link rel="canonical" href="https://smartreno.io/contractors/join" />
      </Helmet>

      <SiteNavbar />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Grow Your Business with SmartReno
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Get matched with qualified homeowner leads in Northern NJ. No cold calling — just structured projects ready for your bid.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => navigate("/contractors/apply")}>
              Apply to Join <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, title: "Qualified Leads", desc: "Pre-screened homeowners with real budgets" },
              { icon: DollarSign, title: "No Upfront Fees", desc: "Only pay when you win a project" },
              { icon: TrendingUp, title: "Grow Revenue", desc: "Consistent pipeline of local projects" },
              { icon: ShieldCheck, title: "Fair Bidding", desc: "Structured scopes for apples-to-apples bids" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <item.icon className="h-8 w-8 text-accent mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Contractors Choose SmartReno</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              "Pre-qualified homeowner leads with verified budgets and timelines",
              "Detailed project scopes so you can bid accurately — fewer change orders",
              "Fair, transparent bidding process with up to 3 contractors per project",
              "Dedicated estimator support throughout the project lifecycle",
              "Serving Bergen, Passaic, Morris, Essex & Hudson counties exclusively",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Grow Your Business?</h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join Northern NJ's premier contractor network. Apply today and start receiving qualified leads.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-background text-foreground hover:bg-background/90"
            onClick={() => navigate("/contractors/apply")}
          >
            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <FooterAdminLogin />
    </main>
  );
}
