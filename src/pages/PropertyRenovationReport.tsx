import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Search, Home, DollarSign, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

const RENOVATION_OPPORTUNITIES = [
  { id: "kitchen", label: "Kitchen Remodel", low: 45000, high: 110000, valueLow: 40000, valueHigh: 120000 },
  { id: "bathroom", label: "Bathroom Remodel", low: 15000, high: 55000, valueLow: 12000, valueHigh: 45000 },
  { id: "basement", label: "Basement Finish", low: 25000, high: 75000, valueLow: 20000, valueHigh: 60000 },
  { id: "openLayout", label: "Open Layout", low: 15000, high: 40000, valueLow: 10000, valueHigh: 35000 },
  { id: "outdoor", label: "Outdoor Living Space", low: 20000, high: 80000, valueLow: 15000, valueHigh: 60000 },
];

export default function PropertyRenovationReport() {
  const [address, setAddress] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const [property] = useState({
    yearBuilt: "",
    sqft: "",
    bedrooms: "",
    bathrooms: "",
    lotSize: "",
    lastSalePrice: "",
  });
  const [editableProperty, setEditableProperty] = useState(property);

  const handleGenerate = () => {
    if (!address.trim()) return;
    setShowReport(true);
  };

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const totalLow = RENOVATION_OPPORTUNITIES.filter((o) => selectedScopes.includes(o.id)).reduce((s, o) => s + o.low, 0);
  const totalHigh = RENOVATION_OPPORTUNITIES.filter((o) => selectedScopes.includes(o.id)).reduce((s, o) => s + o.high, 0);

  return (
    <>
      <Helmet>
        <title>Property Renovation Report | SmartReno</title>
        <meta name="description" content="Analyze renovation opportunities for your home. Get estimated costs and value impact for kitchen, bathroom, basement, and more." />
        <link rel="canonical" href="https://smartreno.io/property-renovation-report" />
      </Helmet>
      <SiteNavbar />
      <main>
        {/* Hero */}
        <section className="py-20 md:py-32 lg:py-40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Analyze Renovation Opportunities For Your Home
            </motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input className="pl-10" placeholder="Enter Property Address" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
              </div>
              <Button onClick={handleGenerate}>Analyze</Button>
            </motion.div>
          </div>
        </section>

        {showReport && (
          <>
            {/* Property Snapshot */}
            <section className="py-12 bg-background">
              <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-2xl font-bold text-foreground mb-6">Property Snapshot</h2>
                <p className="text-sm text-muted-foreground mb-4">Enter your property details below for a more accurate analysis.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "yearBuilt", label: "Year Built", placeholder: "e.g. 1985" },
                    { key: "sqft", label: "Square Footage", placeholder: "e.g. 2400" },
                    { key: "bedrooms", label: "Bedrooms", placeholder: "e.g. 4" },
                    { key: "bathrooms", label: "Bathrooms", placeholder: "e.g. 2.5" },
                    { key: "lotSize", label: "Lot Size", placeholder: "e.g. 0.25 acres" },
                    { key: "lastSalePrice", label: "Last Sale Price", placeholder: "e.g. $450,000" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-sm font-medium text-foreground mb-1 block">{field.label}</label>
                      <Input
                        placeholder={field.placeholder}
                        value={editableProperty[field.key as keyof typeof editableProperty]}
                        onChange={(e) => setEditableProperty((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Renovation Opportunities */}
            <section className="py-12 bg-muted/30">
              <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-2xl font-bold text-foreground mb-8">Renovation Opportunities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {RENOVATION_OPPORTUNITIES.map((opp) => (
                    <Card key={opp.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{opp.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Estimated Cost</span>
                          <span className="font-semibold text-foreground">${opp.low.toLocaleString()} – ${opp.high.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Potential Value Impact</span>
                          <span className="font-semibold text-primary">${opp.valueLow.toLocaleString()} – ${opp.valueHigh.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Scope Builder */}
            <section className="py-12 bg-background">
              <div className="container mx-auto px-4 max-w-2xl">
                <h2 className="text-2xl font-bold text-foreground mb-6">Build Your Renovation Scope</h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {RENOVATION_OPPORTUNITIES.map((opp) => (
                      <label key={opp.id} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={selectedScopes.includes(opp.id)} onCheckedChange={() => toggleScope(opp.id)} />
                        <span className="text-foreground flex-1">{opp.label}</span>
                        <span className="text-sm text-muted-foreground">${opp.low.toLocaleString()} – ${opp.high.toLocaleString()}</span>
                      </label>
                    ))}
                    {selectedScopes.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">Total Renovation Range</span>
                          <span className="text-xl font-bold text-primary">${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-primary text-primary-foreground text-center">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-4">Ready to Move Forward?</h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Submit your project and connect with vetted Northern NJ contractors.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary"><Link to="/start-your-renovation">Start Your Project</Link></Button>
                  <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Link to="/homeowner/intake">Schedule Consultation</Link></Button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
