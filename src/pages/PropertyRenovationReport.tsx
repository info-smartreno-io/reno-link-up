import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Home, DollarSign, TrendingUp, ArrowRight, MapPin,
  Bath, BedDouble, Ruler, Calendar, Trees, Building2, Pencil,
  ChefHat, Droplets, Warehouse, PlusCircle, PaintBucket,
  Shield, Info, Loader2, CheckCircle2
} from "lucide-react";

/* ─── Local cost multipliers by region ─── */
const REGION_MULTIPLIERS: Record<string, { label: string; multiplier: number }> = {
  "07450": { label: "Ridgewood", multiplier: 1.15 },
  "07652": { label: "Paramus", multiplier: 1.05 },
  "07430": { label: "Mahwah", multiplier: 1.08 },
  "07417": { label: "Franklin Lakes", multiplier: 1.20 },
  "07470": { label: "Wayne", multiplier: 1.02 },
  "07042": { label: "Montclair", multiplier: 1.12 },
  "07039": { label: "Livingston", multiplier: 1.10 },
  "07011": { label: "Clifton", multiplier: 0.98 },
  "07052": { label: "West Orange", multiplier: 1.06 },
  "07002": { label: "Bayonne", multiplier: 0.95 },
};

const DEFAULT_MULTIPLIER = 1.0;

/* ─── Renovation opportunity definitions (base NJ costs) ─── */
const RENOVATION_OPPORTUNITIES = [
  { id: "kitchen", label: "Kitchen Remodel", icon: ChefHat, baseLow: 45000, baseHigh: 110000, valueLow: 40000, valueHigh: 120000, description: "Full kitchen renovation including cabinets, countertops, appliances, and layout optimization." },
  { id: "bathroom", label: "Bathroom Remodel", icon: Droplets, baseLow: 15000, baseHigh: 55000, valueLow: 12000, valueHigh: 45000, description: "Complete bathroom upgrade with fixtures, tile, vanity, and potential layout changes." },
  { id: "basement", label: "Basement Finish", icon: Warehouse, baseLow: 25000, baseHigh: 75000, valueLow: 20000, valueHigh: 60000, description: "Transform unfinished basement into living space with flooring, walls, lighting, and egress." },
  { id: "addition", label: "Home Addition", icon: PlusCircle, baseLow: 80000, baseHigh: 250000, valueLow: 60000, valueHigh: 200000, description: "Expand your home's footprint with a new room, second story, or bump-out addition." },
  { id: "exterior", label: "Exterior Upgrades", icon: PaintBucket, baseLow: 15000, baseHigh: 60000, valueLow: 10000, valueHigh: 50000, description: "Siding, roofing, windows, doors, and curb appeal improvements." },
];

/* ─── Suggested opportunities based on property age ─── */
function getSuggestedIds(yearBuilt: number | null, sqft: number | null): string[] {
  const suggestions: string[] = [];
  if (yearBuilt && yearBuilt < 1990) suggestions.push("kitchen", "bathroom");
  if (yearBuilt && yearBuilt < 1980) suggestions.push("exterior");
  if (sqft && sqft < 1800) suggestions.push("addition");
  suggestions.push("basement");
  return [...new Set(suggestions)];
}

/* ─── Property snapshot type ─── */
interface PropertySnapshot {
  yearBuilt: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  lotSize: string;
  propertyType: string;
  town: string;
  zip: string;
}

const EMPTY_SNAPSHOT: PropertySnapshot = {
  yearBuilt: "", sqft: "", bedrooms: "", bathrooms: "", lotSize: "", propertyType: "", town: "", zip: "",
};

/* ─── Simulated auto-populate (placeholder for future API integration) ─── */
function simulatePropertyLookup(address: string): Promise<PropertySnapshot | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate a successful lookup for demo purposes
      const hasZip = address.match(/\b(0\d{4})\b/);
      if (address.trim().length > 5) {
        resolve({
          yearBuilt: "1987",
          sqft: "2,400",
          bedrooms: "4",
          bathrooms: "2.5",
          lotSize: "0.28 acres",
          propertyType: "Single Family",
          town: hasZip && REGION_MULTIPLIERS[hasZip[1]] ? REGION_MULTIPLIERS[hasZip[1]].label : "Northern NJ",
          zip: hasZip ? hasZip[1] : "07450",
        });
      } else {
        resolve(null);
      }
    }, 1500);
  });
}

/* ─── Component ─── */
export default function PropertyRenovationReport() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [property, setProperty] = useState<PropertySnapshot>(EMPTY_SNAPSHOT);
  const [editing, setEditing] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const multiplier = useMemo(() => {
    const entry = REGION_MULTIPLIERS[property.zip];
    return entry ? entry.multiplier : DEFAULT_MULTIPLIER;
  }, [property.zip]);

  const yearBuiltNum = property.yearBuilt ? parseInt(property.yearBuilt) : null;
  const sqftNum = property.sqft ? parseInt(property.sqft.replace(/,/g, "")) : null;
  const suggestedIds = useMemo(() => getSuggestedIds(yearBuiltNum, sqftNum), [yearBuiltNum, sqftNum]);

  const getAdjustedCost = (base: number) => Math.round(base * multiplier / 1000) * 1000;

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const selectedOpps = RENOVATION_OPPORTUNITIES.filter((o) => selectedScopes.includes(o.id));
  const totalLow = selectedOpps.reduce((s, o) => s + getAdjustedCost(o.baseLow), 0);
  const totalHigh = selectedOpps.reduce((s, o) => s + getAdjustedCost(o.baseHigh), 0);

  const handleAnalyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setReportReady(false);
    setSelectedScopes([]);
    const result = await simulatePropertyLookup(address);
    if (result) {
      setProperty(result);
    } else {
      setProperty(EMPTY_SNAPSHOT);
      setEditing(true);
    }
    setLoading(false);
    setReportReady(true);
  };

  const snapshotFields: { key: keyof PropertySnapshot; label: string; icon: React.ElementType; placeholder: string }[] = [
    { key: "yearBuilt", label: "Year Built", icon: Calendar, placeholder: "e.g. 1987" },
    { key: "sqft", label: "Square Footage", icon: Ruler, placeholder: "e.g. 2,400" },
    { key: "bedrooms", label: "Bedrooms", icon: BedDouble, placeholder: "e.g. 4" },
    { key: "bathrooms", label: "Bathrooms", icon: Bath, placeholder: "e.g. 2.5" },
    { key: "lotSize", label: "Lot Size", icon: Trees, placeholder: "e.g. 0.28 acres" },
    { key: "propertyType", label: "Property Type", icon: Building2, placeholder: "e.g. Single Family" },
    { key: "town", label: "Town", icon: MapPin, placeholder: "e.g. Ridgewood" },
    { key: "zip", label: "ZIP Code", icon: MapPin, placeholder: "e.g. 07450" },
  ];

  return (
    <>
      <Helmet>
        <title>Property Renovation Report – Analyze Your Home | SmartReno</title>
        <meta name="description" content="Enter your address to explore renovation opportunities, local cost ranges, and value impact. SmartReno's property evaluation is built for Northern NJ homeowners." />
        <link rel="canonical" href="https://smartreno.io/property-renovation-report" />
      </Helmet>

      <MarketingNavbar />

      <main className="bg-background">
        {/* ───── Hero: Address-First ───── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
          <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-36 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
                <Home className="h-3.5 w-3.5" /> Property Renovation Intelligence
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Discover What Your Home<br className="hidden sm:block" /> Could Become
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Enter your property address to explore renovation opportunities, estimated cost ranges, and potential value impact — tailored to your home and location.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-10 mx-auto max-w-lg">
              <div className="flex rounded-2xl border-2 border-border bg-background shadow-xl shadow-foreground/5 overflow-hidden focus-within:border-foreground/30 transition-colors">
                <div className="flex items-center pl-4 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  className="flex-1 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none"
                  placeholder="Enter your property address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !address.trim()}
                  className="m-1.5 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Analyze</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Serving Bergen, Passaic, Morris, Essex & Hudson counties
              </p>
            </motion.div>
          </div>
        </section>

        <AnimatePresence>
          {reportReady && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* ───── Property Snapshot ───── */}
              <section className="border-t border-border/50 bg-muted/20">
                <div className="mx-auto max-w-5xl px-6 py-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Home Snapshot</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {editing ? "Update any fields to improve accuracy." : "Auto-populated from property data. Edit if needed."}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditing(!editing)}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {editing ? "Done" : "Edit"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {snapshotFields.map((field) => {
                      const Icon = field.icon;
                      return (
                        <Card key={field.key} className="border border-border/60 bg-background shadow-none">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium uppercase tracking-wider">{field.label}</span>
                            </div>
                            {editing ? (
                              <Input
                                className="h-8 text-sm border-border/50"
                                placeholder={field.placeholder}
                                value={property[field.key]}
                                onChange={(e) => setProperty((p) => ({ ...p, [field.key]: e.target.value }))}
                              />
                            ) : (
                              <p className="text-lg font-semibold text-foreground">
                                {property[field.key] || <span className="text-muted-foreground/50 text-sm font-normal">—</span>}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ───── Renovation Opportunities ───── */}
              <section className="border-t border-border/50">
                <div className="mx-auto max-w-5xl px-6 py-16">
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Renovation Opportunities</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on your property's age, size, and location.
                      {property.town && <> Cost ranges adjusted for <strong>{property.town}</strong> market.</>}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {RENOVATION_OPPORTUNITIES.map((opp) => {
                      const Icon = opp.icon;
                      const isSuggested = suggestedIds.includes(opp.id);
                      const low = getAdjustedCost(opp.baseLow);
                      const high = getAdjustedCost(opp.baseHigh);
                      return (
                        <motion.div key={opp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * RENOVATION_OPPORTUNITIES.indexOf(opp) }}>
                          <Card className={`relative border-2 transition-all h-full ${isSuggested ? "border-foreground/20 shadow-md" : "border-border/60"}`}>
                            {isSuggested && (
                              <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background uppercase tracking-wider">
                                <CheckCircle2 className="h-3 w-3" /> Suggested
                              </span>
                            )}
                            <CardContent className="p-6">
                              <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center mb-4">
                                <Icon className="h-5 w-5 text-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">{opp.label}</h3>
                              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{opp.description}</p>

                              <div className="space-y-2 pt-3 border-t border-border/40">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Estimated Cost</span>
                                  <span className="text-sm font-semibold text-foreground">${low.toLocaleString()} – ${high.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Value Impact</span>
                                  <span className="text-sm font-semibold text-accent">${opp.valueLow.toLocaleString()} – ${opp.valueHigh.toLocaleString()}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ───── Scope Builder ───── */}
              <section className="border-t border-border/50 bg-muted/20">
                <div className="mx-auto max-w-3xl px-6 py-16">
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Build Your Renovation Scope</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select the projects you're considering to see a preliminary total range.</p>
                  </div>

                  <Card className="border-2 border-border/60">
                    <CardContent className="p-6 space-y-1">
                      {RENOVATION_OPPORTUNITIES.map((opp) => {
                        const isSelected = selectedScopes.includes(opp.id);
                        const low = getAdjustedCost(opp.baseLow);
                        const high = getAdjustedCost(opp.baseHigh);
                        return (
                          <label
                            key={opp.id}
                            className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-foreground/5" : "hover:bg-muted/50"}`}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleScope(opp.id)} />
                            <span className="flex-1 font-medium text-foreground">{opp.label}</span>
                            <span className="text-sm text-muted-foreground font-mono">${low.toLocaleString()} – ${high.toLocaleString()}</span>
                          </label>
                        );
                      })}

                      <AnimatePresence>
                        {selectedScopes.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t-2 border-border/40 flex justify-between items-center">
                              <span className="text-lg font-semibold text-foreground">Preliminary Total Range</span>
                              <span className="text-2xl font-bold text-foreground">${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ───── Methodology Note ───── */}
              <section className="border-t border-border/50">
                <div className="mx-auto max-w-3xl px-6 py-10">
                  <div className="flex gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                    <div className="shrink-0 h-10 w-10 rounded-full bg-muted grid place-items-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">About These Estimates</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Cost ranges shown are preliminary and based on your property's age, size, location, and SmartReno's Northern NJ pricing assumptions. They are <strong>not a quote</strong>. Final pricing requires an on-site walkthrough and detailed scope confirmation by a SmartReno estimator.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ───── CTA ───── */}
              <section className="border-t border-border/50 bg-foreground">
                <div className="mx-auto max-w-3xl px-6 py-20 text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-background mb-4">
                    Ready to Take the Next Step?
                  </h2>
                  <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed">
                    Submit your project details and connect with SmartReno's team for a structured renovation plan — starting with a professional walkthrough.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8 py-6 h-auto rounded-xl">
                      <Link to="/start-your-renovation">Start Your Project <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 text-base px-8 py-6 h-auto rounded-xl">
                      <Link to="/homeowner/intake">Schedule Consultation</Link>
                    </Button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MarketingFooter />
    </>
  );
}
