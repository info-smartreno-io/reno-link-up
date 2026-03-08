import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DollarSign, ArrowRight } from "lucide-react";

interface CostGuideData {
  title: string;
  metaTitle: string;
  metaDesc: string;
  heroTitle: string;
  heroSub: string;
  typicalRange: string;
  njAvg: string;
  breakdown: { item: string; range: string; pct: number }[];
  factors: string[];
  tips: string[];
}

const GUIDES: Record<string, CostGuideData> = {
  "kitchen-remodel-cost-nj": {
    title: "Kitchen Remodel",
    metaTitle: "Kitchen Remodel Cost in NJ (2025) | SmartReno",
    metaDesc: "How much does a kitchen remodel cost in Northern New Jersey? Explore real cost ranges from $35K–$120K+ with detailed breakdowns.",
    heroTitle: "Kitchen Remodel Cost in Northern New Jersey",
    heroSub: "Real cost data from hundreds of NJ kitchen renovations.",
    typicalRange: "$35,000 – $120,000+",
    njAvg: "$65,000",
    breakdown: [
      { item: "Cabinetry", range: "$8,000 – $30,000", pct: 35 },
      { item: "Countertops", range: "$3,000 – $12,000", pct: 15 },
      { item: "Appliances", range: "$3,000 – $15,000", pct: 12 },
      { item: "Electrical", range: "$2,000 – $6,000", pct: 8 },
      { item: "Plumbing", range: "$2,000 – $8,000", pct: 8 },
      { item: "Flooring", range: "$2,000 – $8,000", pct: 8 },
      { item: "Labor", range: "$10,000 – $35,000", pct: 14 },
    ],
    factors: ["Kitchen size and layout complexity", "Cabinet quality (stock vs. semi-custom vs. custom)", "Countertop material (laminate, quartz, granite, marble)", "Appliance package tier", "Electrical and plumbing changes", "Permit requirements"],
    tips: ["Get at least 3 quotes from licensed contractors", "Budget 10-15% contingency for unexpected issues", "Prioritize layout efficiency over luxury finishes", "Consider refacing cabinets for budget-friendly updates"],
  },
  "bathroom-remodel-cost-nj": {
    title: "Bathroom Remodel",
    metaTitle: "Bathroom Remodel Cost in NJ (2025) | SmartReno",
    metaDesc: "How much does a bathroom remodel cost in Northern NJ? See real cost ranges from $15K–$60K+ with breakdowns by category.",
    heroTitle: "Bathroom Remodel Cost in Northern New Jersey",
    heroSub: "Real cost data from hundreds of NJ bathroom renovations.",
    typicalRange: "$15,000 – $60,000+",
    njAvg: "$32,000",
    breakdown: [
      { item: "Tile & Surfaces", range: "$3,000 – $12,000", pct: 25 },
      { item: "Plumbing Fixtures", range: "$2,000 – $8,000", pct: 15 },
      { item: "Vanity & Storage", range: "$1,500 – $6,000", pct: 12 },
      { item: "Shower/Tub", range: "$2,000 – $10,000", pct: 18 },
      { item: "Electrical", range: "$1,000 – $4,000", pct: 8 },
      { item: "Plumbing Labor", range: "$2,000 – $8,000", pct: 12 },
      { item: "General Labor", range: "$3,000 – $10,000", pct: 10 },
    ],
    factors: ["Bathroom size (half, full, or master)", "Fixture quality and brand", "Tile material and pattern complexity", "Plumbing relocation needs", "Ventilation and lighting upgrades", "Accessibility requirements"],
    tips: ["Waterproofing is critical — don't cut corners", "Consider a curbless shower for modern appeal", "Heated floors are a cost-effective luxury add", "Ventilation upgrades prevent long-term damage"],
  },
  "basement-remodel-cost-nj": {
    title: "Basement Remodel",
    metaTitle: "Basement Remodel Cost in NJ (2025) | SmartReno",
    metaDesc: "How much does a basement remodel cost in Northern NJ? Explore real cost ranges from $25K–$80K+ with detailed breakdowns.",
    heroTitle: "Basement Remodel Cost in Northern New Jersey",
    heroSub: "Real cost data from hundreds of NJ basement finishing projects.",
    typicalRange: "$25,000 – $80,000+",
    njAvg: "$45,000",
    breakdown: [
      { item: "Framing & Drywall", range: "$5,000 – $15,000", pct: 25 },
      { item: "Flooring", range: "$3,000 – $10,000", pct: 15 },
      { item: "Electrical", range: "$3,000 – $8,000", pct: 14 },
      { item: "Plumbing (bathroom)", range: "$3,000 – $10,000", pct: 12 },
      { item: "HVAC", range: "$2,000 – $8,000", pct: 10 },
      { item: "Egress Window", range: "$2,000 – $5,000", pct: 8 },
      { item: "Labor", range: "$5,000 – $18,000", pct: 16 },
    ],
    factors: ["Basement ceiling height", "Moisture and waterproofing needs", "Egress window requirements", "Bathroom addition", "HVAC extension", "Permit and inspection requirements"],
    tips: ["Address moisture issues before finishing", "Egress windows are required for bedrooms", "Consider luxury vinyl plank for durability", "Plan for adequate lighting in low-ceiling spaces"],
  },
  "home-addition-cost-nj": {
    title: "Home Addition",
    metaTitle: "Home Addition Cost in NJ (2025) | SmartReno",
    metaDesc: "How much does a home addition cost in Northern NJ? Explore real cost ranges from $80K–$250K+ with detailed breakdowns.",
    heroTitle: "Home Addition Cost in Northern New Jersey",
    heroSub: "Real cost data from hundreds of NJ home addition projects.",
    typicalRange: "$80,000 – $250,000+",
    njAvg: "$150,000",
    breakdown: [
      { item: "Foundation", range: "$10,000 – $30,000", pct: 15 },
      { item: "Framing & Structure", range: "$15,000 – $50,000", pct: 22 },
      { item: "Roofing", range: "$5,000 – $20,000", pct: 10 },
      { item: "Electrical", range: "$5,000 – $15,000", pct: 8 },
      { item: "Plumbing", range: "$5,000 – $15,000", pct: 8 },
      { item: "HVAC", range: "$5,000 – $15,000", pct: 8 },
      { item: "Interior Finishes", range: "$15,000 – $50,000", pct: 18 },
      { item: "Permits & Architecture", range: "$5,000 – $15,000", pct: 6 },
    ],
    factors: ["Addition size and number of stories", "Foundation type (slab, crawl, full basement)", "Architectural design complexity", "Zoning setback requirements", "Utility connections", "Integration with existing structure"],
    tips: ["Check zoning before designing", "Get architectural plans before bidding", "Budget for site work and landscaping repair", "Consider bump-outs for cost-effective space"],
  },
};

export default function CostGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? GUIDES[slug] : undefined;

  if (!guide) {
    return (
      <>
        <SiteNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Cost guide not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{guide.metaTitle}</title>
        <meta name="description" content={guide.metaDesc} />
        <link rel="canonical" href={`https://smartreno.io/${slug}`} />
      </Helmet>
      <SiteNavbar />
      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {guide.heroTitle}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 text-lg text-muted-foreground">
              {guide.heroSub}
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 inline-flex items-center gap-6 bg-card border border-border rounded-xl px-8 py-5 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Typical Range</p>
                <p className="text-xl font-bold text-foreground">{guide.typicalRange}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">NNJ Average</p>
                <p className="text-xl font-bold text-primary">{guide.njAvg}</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-8">Cost Breakdown</h2>
            <div className="space-y-4">
              {guide.breakdown.map((item) => (
                <div key={item.item} className="flex items-center gap-4">
                  <span className="w-36 text-sm font-medium text-foreground">{item.item}</span>
                  <div className="flex-1 bg-border rounded-full h-3 overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-sm text-muted-foreground w-40 text-right">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Factors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Key Cost Factors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guide.factors.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pro Tips</h2>
            <div className="space-y-3">
              {guide.tips.map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Get Your {guide.title} Started</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Connect with vetted Northern NJ contractors for your {guide.title.toLowerCase()}.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary"><Link to="/start-your-renovation">Start Your Project</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Link to="/renovation-costs">View All Cost Guides</Link></Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
