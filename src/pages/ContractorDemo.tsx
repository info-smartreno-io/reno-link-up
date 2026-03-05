import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { CheckCircle, Menu } from "lucide-react";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ContractorDemo() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleJoinWaitlist = () => {
    navigate("/contractor/auth");
    setMobileMenuOpen(false);
  };
  
  const primaryColor = "#1E3A8A";
  const accentColor = "#22C55E";
  const logoText = "SmartReno";
  const heroEyebrow = "Contractor Platform Demo";
  const heroHeadline = "Win more jobs with plans‑ready RFPs & homeowner messaging";
  const heroSub = "See how SmartReno centralizes plans, RFIs, selections, and proposals so you price faster and deliver on time.";
  const ctaText = "Request a Demo";
  const emailAddress = "info@smartreno.io";
  const phoneNumber = "(201) 788-9502";
  const regionText = "Northern New Jersey";

  // Version indicator for deployment verification
  const buildVersion = "v2024.12.18.2";

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contractors - Join SmartReno Network | Qualified Leads & Growth</title>
        <meta name="description" content="Win more jobs with plans-ready RFPs. Access qualified homeowner leads, centralized messaging, and transparent bidding. Free to join, 3-5% transaction fee." />
        <link rel="canonical" href="https://smartreno.io/contractors" />
        <meta property="og:title" content="Contractors - Join SmartReno Network" />
        <meta property="og:description" content="Win more jobs with plans-ready RFPs and homeowner messaging. Free to join." />
        <meta property="og:url" content="https://smartreno.io/contractors" />
      </Helmet>
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={smartrenoLogo} alt="SmartReno" className="h-10" />
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#integrations" className="text-slate-600 hover:text-slate-900 transition-colors">Integrations</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <a href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">Blog</a>
            <Button onClick={handleJoinWaitlist}>Join Waitlist</Button>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <a 
                    href="#features" 
                    className="text-lg font-medium text-slate-700 hover:text-slate-900 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#integrations" 
                    className="text-lg font-medium text-slate-700 hover:text-slate-900 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Integrations
                  </a>
                  <a 
                    href="#pricing" 
                    className="text-lg font-medium text-slate-700 hover:text-slate-900 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <a 
                    href="/blog" 
                    className="text-lg font-medium text-slate-700 hover:text-slate-900 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Blog
                  </a>
                  <hr className="my-2" />
                  <Button onClick={handleJoinWaitlist} className="w-full justify-center">
                    Join Waitlist
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full text-xs font-bold mb-4">
              {heroEyebrow} • {regionText}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{heroHeadline}</h1>
            <p className="mt-4 text-lg text-slate-600">{heroSub}</p>
            <ul className="mt-6 space-y-3">
              {[
                "Architectural plan sets ready to bid",
                "Transparent RFPs with scopes, photos & files",
                "Homeowner messaging, selections & change orders in one place",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <div id="demo" className="border border-slate-200 rounded-2xl p-8 shadow-lg bg-white text-center">
            <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
            <p className="text-slate-600 mb-6">
              The SmartReno Contractor Portal is launching soon. Join our priority waitlist to be the first to know!
            </p>
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handleJoinWaitlist}>
                Join Priority Waitlist
              </Button>
              <p className="text-xs text-slate-500">
                Free to join • 3-5% transaction fee • No monthly costs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Everything you need to bid and deliver</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["Plans‑ready RFPs", "Architect‑stamped drawings and scoped details for fast, accurate pricing."],
              ["Centralized Messaging", "Homeowners, estimators, selections, and RFIs in one thread."],
              ["Change Orders", "Track approvals, deltas, and audit logs with a click."],
              ["Scheduling & Calendar", "Walkthroughs and milestones synced with Google Calendar."],
              ["File & Photo Library", "Site photos, plans, and specs organized by project."],
              ["QuickBooks‑ready Exports", "Keep accounting clean with CSV/JSON exports (QBO‑friendly)."],
            ].map(([title, desc], i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Works with your stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["Stripe", "QuickBooks", "Google Calendar", "Twilio SMS"].map((name, i) => (
              <div key={i} className="border border-dashed border-slate-300 rounded-xl p-4 text-center font-semibold text-slate-700">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Simple pricing</h2>
          <div className="border border-slate-200 rounded-2xl p-6 bg-white max-w-2xl">
            <h3 className="font-bold text-lg">Free to join • 3–5% transaction fee per job</h3>
            <p className="text-sm text-slate-600 mt-2">Early‑adopter discounts available for the first 25 contractors.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid sm:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-bold mb-2">{logoText}</div>
            <p className="text-slate-600">© {new Date().getFullYear()} {logoText}. All rights reserved.</p>
            <p className="text-slate-400 text-xs mt-1">{buildVersion}</p>
          </div>
          <div>
            <div className="font-bold mb-2">Product</div>
            <a href="#features" className="block text-slate-600 hover:underline">Features</a>
            <a href="#integrations" className="block text-slate-600 hover:underline mt-1">Integrations</a>
            <a href="#pricing" className="block text-slate-600 hover:underline mt-1">Pricing</a>
          </div>
          <div>
            <div className="font-bold mb-2">Company</div>
            <a href="/#about" className="block text-slate-600 hover:underline">About</a>
            <a href="/blog" className="block text-slate-600 hover:underline mt-1">Blog</a>
          </div>
          <div>
            <div className="font-bold mb-2">Contact</div>
            <div className="text-slate-600">{emailAddress}</div>
            <div className="text-slate-600">{phoneNumber}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}