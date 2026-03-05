import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { CheckCircle, Palette, Users, DollarSign, Clock, Shield } from "lucide-react";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";

export default function InteriorDesignerLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoText = "SmartReno";
  const heroHeadline = "Join SmartReno's Interior Design Network";
  const heroSub = "Access curated residential projects that need your design expertise. Collaborate with homeowners and contractors on transformative spaces.";
  const ctaText = "Apply as Interior Designer";
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

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Interior Designers - Join SmartReno Network | Curated Projects</title>
        <meta name="description" content="Access pre-qualified residential design projects. Collaborate with homeowners and contractors. Secure payments and milestone tracking. Northern NJ." />
        <link rel="canonical" href="https://smartreno.io/interiordesigners" />
        <meta property="og:title" content="Interior Designers - Join SmartReno Network" />
        <meta property="og:description" content="Access curated residential projects that need your design expertise." />
        <meta property="og:url" content="https://smartreno.io/interiordesigners" />
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
            <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
            <Button asChild><Link to="/interiordesigner/auth">Sign In</Link></Button>
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
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-purple-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </a>
              <a 
                href="#benefits" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-purple-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits
              </a>
              <a 
                href="#faq" 
                className="block border-l-4 border-transparent px-5 py-3 text-base font-medium hover:border-purple-600 hover:bg-slate-50 transition-all text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
            </nav>

            {/* Drawer CTAs */}
            <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4">
              <Link to="/interiordesigner/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              Interior Design Network • {regionText}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{heroHeadline}</h1>
            <p className="mt-4 text-lg text-slate-600">{heroSub}</p>

            <div className="mt-6 space-y-3">
              {[
                "Pre-qualified homeowners ready for design services",
                "Transparent project scopes with budget expectations",
                "Collaborate directly with contractors and homeowners",
                "Secure payment processing and milestone tracking",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button size="lg" asChild>
                <Link to="/interiordesigner/apply">{ctaText}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#how">Learn More</a>
              </Button>
            </div>
          </div>

          {/* Simple CTA Card */}
          <div className="border border-slate-200 rounded-2xl p-8 shadow-lg bg-gradient-to-br from-white to-purple-50">
            <h3 className="text-xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-slate-600 mb-6">
              Join our network of talented interior designers and start accessing qualified residential projects in Northern New Jersey.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild className="w-full">
                <Link to="/interiordesigner/apply">{ctaText}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full">
                <a href="#how">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Create Profile",
                desc: "Sign up and showcase your portfolio, specialties, and service areas.",
              },
              {
                step: "2",
                title: "Browse Projects",
                desc: "View curated bid opportunities that match your expertise and availability.",
              },
              {
                step: "3",
                title: "Submit Proposals",
                desc: "Submit detailed design proposals with timelines and pricing.",
              },
              {
                step: "4",
                title: "Win & Deliver",
                desc: "Get selected by homeowners and collaborate seamlessly through completion.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Why join our network?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Vetted Clients",
                desc: "All homeowners are pre-qualified with verified budgets and timelines.",
              },
              {
                icon: Clock,
                title: "Flexible Schedule",
                desc: "Choose projects that fit your availability and workload.",
              },
              {
                icon: DollarSign,
                title: "Fair Pricing",
                desc: "No monthly fees. Simple 3-5% transaction fee only on won projects.",
              },
              {
                icon: Users,
                title: "Collaboration Tools",
                desc: "Direct messaging, file sharing, and project management in one platform.",
              },
              {
                icon: Palette,
                title: "Showcase Work",
                desc: "Build your portfolio with before/after photos and client testimonials.",
              },
              {
                icon: CheckCircle,
                title: "Secure Payments",
                desc: "Milestone-based payments with escrow protection and dispute resolution.",
              },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Projects */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Ideal project types</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Kitchen & Bath Remodels",
              "Whole Home Renovations",
              "Living Room Transformations",
              "Basement Finishing",
              "Home Office Design",
              "Master Suite Upgrades",
              "Open Concept Conversions",
              "Color Consultations",
            ].map((type, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 text-center font-medium text-slate-700 hover:border-purple-300 transition-colors">
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "What are the requirements to join?",
                a: "Active design portfolio, proof of insurance (if applicable), and references from previous residential clients. We welcome both independent designers and firm representatives.",
              },
              {
                q: "How much does it cost?",
                a: "Free to join with no monthly fees. We charge a 3-5% transaction fee only on projects you win through our platform.",
              },
              {
                q: "How do I get paid?",
                a: "Milestone-based payments are processed through our secure escrow system. You set the payment schedule in your proposal, and funds are released as milestones are completed.",
              },
              {
                q: "Can I work with my own contractors?",
                a: "Yes! You can recommend contractors from our vetted network or collaborate with contractors you already work with.",
              },
              {
                q: "What areas do you serve?",
                a: "Currently serving Bergen, Passaic, Morris, Essex, and Hudson counties in Northern New Jersey. Expanding to additional regions soon.",
              },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold mb-2">{item.q}</h3>
                <p className="text-sm text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your design business?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join our network of talented interior designers and start accessing qualified projects today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/interiordesigner/apply">{ctaText}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={`mailto:${emailAddress}`}>Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid sm:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-bold mb-2">{logoText}</div>
            <p className="text-slate-600">© {new Date().getFullYear()} {logoText}. All rights reserved.</p>
          </div>
          <div>
            <div className="font-bold mb-2">Product</div>
            <a href="#how" className="block text-slate-600 hover:underline">How it works</a>
            <a href="#benefits" className="block text-slate-600 hover:underline mt-1">Benefits</a>
            <a href="#faq" className="block text-slate-600 hover:underline mt-1">FAQ</a>
          </div>
          <div>
            <div className="font-bold mb-2">Professionals</div>
            <a href="/contractors" className="block text-slate-600 hover:underline">Contractors</a>
            <a href="/architects" className="block text-slate-600 hover:underline mt-1">Architects</a>
            <a href="/interiordesigners" className="block text-slate-600 hover:underline mt-1">Interior Designers</a>
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
