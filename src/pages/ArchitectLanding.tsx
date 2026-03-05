import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";

export default function ArchitectLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryColor = "#1E3A8A";
  const accentColor = "#10B981";
  const logoText = "SmartReno";
  const heroHeadline = "Join SmartReno's Architect Network";
  const heroSub = "Get matched with homeowners who need design + permitting. Bid on projects, sync with contractors, and grow recurring revenue.";
  const ctaText = "Apply as an Architect";
  const emailAddress = "info@smartreno.io";
  const phoneNumber = "(201) 788-9502";
  const regionText = "Northern New Jersey";

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const contactName = formData.get("contact_name") as string;

    try {
      // For now, just redirect to password creation
      // In the future, you can add architect application table submission here
      toast({
        title: "Application Received!",
        description: "Now let's create your account password.",
      });

      // Redirect to password creation
      navigate(`/create-password?email=${encodeURIComponent(email)}&name=${encodeURIComponent(contactName)}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Architects - Join SmartReno Network | Design Projects & Growth</title>
        <meta name="description" content="Get matched with homeowners who need design + permitting. Bid on residential projects, collaborate with contractors. Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/architects" />
        <meta property="og:title" content="Architects - Join SmartReno Network" />
        <meta property="og:description" content="Access qualified design projects that require plans, permits, or structural details." />
        <meta property="og:url" content="https://smartreno.io/architects" />
      </Helmet>
      {/* Nav */}
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={smartrenoLogo} alt="SmartReno" className="h-10" />
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
            <a href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">Blog</a>
            <a href="#apply" className="text-slate-600 hover:text-slate-900 transition-colors">Apply</a>
          </nav>
          
          {/* Hamburger Menu (mobile) */}
          <button 
            type="button" 
            className="flex md:hidden items-center justify-center p-2" 
            onClick={() => setMobileMenuOpen(true)} 
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-[100] bg-black/50 animate-in fade-in duration-300" 
            onClick={() => setMobileMenuOpen(false)} 
            aria-hidden="true" 
          />
          
          {/* Drawer */}
          <div 
            className="fixed top-0 right-0 bottom-0 z-[101] w-4/5 max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300" 
            role="dialog" 
            aria-modal="true" 
            aria-label="Mobile navigation"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={smartrenoLogo} alt="SmartReno" className="h-10" />
              </a>
              <button 
                type="button" 
                className="flex items-center justify-center p-2" 
                onClick={() => setMobileMenuOpen(false)} 
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer Nav Links */}
            <nav className="flex-1 overflow-auto py-4">
              <a 
                href="#how" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-emerald-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </a>
              <a 
                href="#benefits" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-emerald-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits
              </a>
              <a 
                href="/blog" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-emerald-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </a>
              <a 
                href="#apply" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-emerald-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Apply
              </a>
            </nav>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              Architect Network • {regionText}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{heroHeadline}</h1>
            <p className="mt-4 text-lg text-slate-600">{heroSub}</p>

            <div className="mt-6 space-y-3">
              {[
                "Matched projects that require plans, permits, or structural details",
                "Single-click handoff to vetted contractors for build phase",
                "Transparent bidding with homeowner Q&A in one place",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Form */}
          <div id="apply" className="border border-slate-200 rounded-2xl p-6 shadow-lg bg-white">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Firm Name</label>
                <input 
                  type="text" 
                  name="firm_name" 
                  placeholder="Acme Architecture" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                  <input type="text" name="contact_name" placeholder="Jane Doe" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" placeholder="jane@acme.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" name="phone" placeholder="201-555-1212" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License State</label>
                  <input type="text" name="license_state" placeholder="NJ" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Services</label>
                <input 
                  type="text" 
                  name="services" 
                  placeholder="e.g., Additions, Interior Remodels, Kitchens, Structural" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                  <input type="text" name="region" placeholder="Bergen, Passaic, Morris" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                  <input type="url" name="website" placeholder="https://acmearch.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  ctaText
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                By applying, you agree to be contacted about SmartReno's Architect Network.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Benefits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Qualified Leads",
                body: "We surface homeowners already scoped for design/permitting—no cold outreach required.",
              },
              {
                title: "Seamless Handoff",
                body: "When plans are signed off, push the project to vetted contractors for fast, transparent bids.",
              },
              {
                title: "Fewer Change Orders",
                body: "Shared portal keeps selections, clarifications, and RFIs centralized to reduce rework.",
              },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "1) Apply",
                body: "Tell us your services, license state, and region. We'll review and approve qualified firms.",
              },
              {
                title: "2) Get Matched",
                body: "Receive opportunities where homeowners need drawings, permits, or structural details.",
              },
              {
                title: "3) Bid & Deliver",
                body: "Win the design scope. When complete, hand off to contractors in one click for build bids.",
              },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">FAQs</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              ["Who can join?", "Licensed architects and design firms with residential experience in our active regions."],
              ["How are projects priced?", "You scope and price your design work. Construction bidding is separate and transparent to the homeowner."],
              ["Do I need to manage the build?", "No. After design, you can hand off to contractors. You may optionally provide construction admin."],
            ].map(([q, a], i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="font-bold">{q}</h3>
                <p className="text-sm text-slate-600 mt-2">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center flex-wrap gap-4 text-sm text-slate-600">
          <div>© {new Date().getFullYear()} {logoText}. All rights reserved.</div>
          <div>Contact: {emailAddress} • {phoneNumber}</div>
        </div>
      </footer>
    </div>
  );
}
