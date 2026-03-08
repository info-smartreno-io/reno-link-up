import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { DollarSign, ChefHat, Bath, Home, Warehouse, PaintBucket, Hammer, ArrowRight, Calculator } from "lucide-react";

const CATEGORIES = [
  { title: "Kitchen Remodel", icon: ChefHat, range: "$35,000 – $120,000+", avg: "$65,000", link: "/kitchen-remodel-cost-nj", color: "bg-primary/10 text-primary" },
  { title: "Bathroom Remodel", icon: Bath, range: "$15,000 – $60,000+", avg: "$32,000", link: "/bathroom-remodel-cost-nj", color: "bg-accent/10 text-accent" },
  { title: "Basement Remodel", icon: Warehouse, range: "$25,000 – $80,000+", avg: "$45,000", link: "/basement-remodel-cost-nj", color: "bg-primary/10 text-primary" },
  { title: "Home Addition", icon: Home, range: "$80,000 – $250,000+", avg: "$150,000", link: "/home-addition-cost-nj", color: "bg-accent/10 text-accent" },
  { title: "Whole Home Renovation", icon: Hammer, range: "$100,000 – $400,000+", avg: "$200,000", link: "/renovation-costs", color: "bg-primary/10 text-primary" },
  { title: "Exterior Renovation", icon: PaintBucket, range: "$20,000 – $80,000+", avg: "$40,000", link: "/renovation-costs", color: "bg-accent/10 text-accent" },
];

const KITCHEN_BREAKDOWN = [
  { item: "Cabinetry", range: "$8,000 – $30,000", pct: 35 },
  { item: "Countertops", range: "$3,000 – $12,000", pct: 15 },
  { item: "Appliances", range: "$3,000 – $15,000", pct: 12 },
  { item: "Electrical", range: "$2,000 – $6,000", pct: 8 },
  { item: "Plumbing", range: "$2,000 – $8,000", pct: 8 },
  { item: "Flooring", range: "$2,000 – $8,000", pct: 8 },
  { item: "Labor", range: "$10,000 – $35,000", pct: 14 },
];

const COST_PER_SQFT: Record<string, Record<string, number[]>> = {
  kitchen: { standard: [150, 250], mid: [250, 400], high: [400, 650] },
  bathroom: { standard: [200, 350], mid: [350, 550], high: [550, 900] },
  basement: { standard: [30, 50], mid: [50, 80], high: [80, 130] },
  addition: { standard: [200, 300], mid: [300, 450], high: [450, 700] },
};

export default function RenovationCosts() {
  const [projectType, setProjectType] = useState("");
  const [sqft, setSqft] = useState("");
  const [finishLevel, setFinishLevel] = useState("");
  const [estimate, setEstimate] = useState<{ low: number; high: number } | null>(null);

  const calculate = () => {
    const sq = parseInt(sqft);
    if (!projectType || !finishLevel || isNaN(sq) || sq <= 0) return;
    const rates = COST_PER_SQFT[projectType]?.[finishLevel];
    if (!rates) return;
    setEstimate({ low: rates[0] * sq, high: rates[1] * sq });
  };

  return (
    <>
      <Helmet>
        <title>Real Renovation Costs in Northern New Jersey | SmartReno</title>
        <meta name="description" content="Explore real renovation cost ranges for kitchens, bathrooms, basements, additions, and whole-home remodels in Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/renovation-costs" />
      </Helmet>
      <SiteNavbar />
      <main>
        {/* Hero */}
        <section className="py-20 md:py-32 lg:py-40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Real Renovation Costs in Northern New Jersey
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore real renovation cost ranges for kitchens, bathrooms, basements, additions, and whole-home remodels.
            </motion.p>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Renovation Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {CATEGORIES.map((cat, i) => (
                <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link to={cat.link}>
                    <Card className="group hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className={`p-3 rounded-lg ${cat.color}`}>
                          <cat.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{cat.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Typical Range</p>
                        <p className="text-lg font-semibold text-foreground">{cat.range}</p>
                        <p className="text-sm text-muted-foreground mt-1">NNJ Average: <span className="font-medium text-primary">{cat.avg}</span></p>
                        <span className="inline-flex items-center text-sm text-primary mt-3 group-hover:underline">
                          View Details <ArrowRight className="ml-1 h-4 w-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">Kitchen Remodel Cost Breakdown</h2>
            <p className="text-center text-muted-foreground mb-8">Typical Range: $35,000 – $120,000+ &nbsp;|&nbsp; Northern NJ Average: $65,000</p>
            <div className="space-y-4">
              {KITCHEN_BREAKDOWN.map((item) => (
                <div key={item.item} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium text-foreground">{item.item}</span>
                  <div className="flex-1 bg-border rounded-full h-3 overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-sm text-muted-foreground w-36 text-right">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Calculator className="h-7 w-7 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Renovation Cost Calculator</h2>
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Project Type</label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen Remodel</SelectItem>
                      <SelectItem value="bathroom">Bathroom Remodel</SelectItem>
                      <SelectItem value="basement">Basement Remodel</SelectItem>
                      <SelectItem value="addition">Home Addition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Square Footage</label>
                  <Input type="number" placeholder="e.g. 200" value={sqft} onChange={(e) => setSqft(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Finish Level</label>
                  <Select value={finishLevel} onValueChange={setFinishLevel}>
                    <SelectTrigger><SelectValue placeholder="Select finish level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="mid">Mid-Range</SelectItem>
                      <SelectItem value="high">High-End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={calculate}>Calculate Estimate</Button>
                {estimate && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Renovation Cost Range</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Renovation?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Get a personalized renovation plan and connect with vetted Northern NJ contractors.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary"><Link to="/start-your-renovation">Start Your Project</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Link to="/property-renovation-report">Get Property Report</Link></Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
