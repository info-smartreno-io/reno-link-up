import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ClipboardList, Eye, FileText, Users, BarChart3, Handshake, Hammer } from "lucide-react";

const STEPS = [
  { step: 1, title: "Project Planning", desc: "Homeowners submit project details, photos, and budget information.", icon: ClipboardList },
  { step: 2, title: "On-Site Walkthrough", desc: "A project professional visits the home to review conditions, capture photos, and verify measurements.", icon: Eye },
  { step: 3, title: "Scope Development", desc: "Project details are organized into a structured renovation scope.", icon: FileText },
  { step: 4, title: "Contractor Bidding", desc: "Qualified contractors receive a detailed bid packet.", icon: Users },
  { step: 5, title: "Proposal Review", desc: "Homeowners compare contractor proposals.", icon: BarChart3 },
  { step: 6, title: "Pre-Construction Alignment", desc: "Final walkthrough confirms scope and expectations.", icon: Handshake },
  { step: 7, title: "Project Execution", desc: "Construction begins with a clear scope and timeline.", icon: Hammer },
];

export default function SmartRenoProcess() {
  return (
    <>
      <Helmet>
        <title>The SmartReno Process | How It Works | SmartReno</title>
        <meta name="description" content="A structured approach to residential renovations. Learn how SmartReno guides your project from planning to completion." />
        <link rel="canonical" href="https://smartreno.io/smartreno-process" />
      </Helmet>
      <SiteNavbar />
      <main>
        {/* Hero */}
        <section className="py-20 md:py-32 lg:py-40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              The SmartReno Process
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              A structured approach to residential renovations.
            </motion.p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              <div className="space-y-12">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex gap-6 items-start"
                  >
                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                      <s.icon className="h-7 w-7" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-primary uppercase tracking-wide">Step {s.step}</p>
                      <h3 className="text-xl font-bold text-foreground mt-1">{s.title}</h3>
                      <p className="text-muted-foreground mt-2">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Get Started Today</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Whether you're a homeowner planning a renovation or a contractor looking to grow, SmartReno is here for you.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary"><Link to="/start-your-renovation">Start Your Project</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Link to="/contractors/join">Join the Contractor Network</Link></Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
