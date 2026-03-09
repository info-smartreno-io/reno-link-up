import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Shield, Loader2, CheckCircle2
} from "lucide-react";
import { ALL_TOWNS } from "@/data/locations";
import Fuse from "fuse.js";

/* ─── Build searchable town index ─── */
const TOWN_INDEX = ALL_TOWNS.map((t) => ({
  name: t.name,
  county: t.county,
  zip: t.zipCodes[0] || "",
  allZips: t.zipCodes,
  slug: t.slug,
}));

const fuse = new Fuse(TOWN_INDEX, {
  keys: ["name", "zip"],
  threshold: 0.3,
  includeScore: true,
});

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
  "07960": { label: "Morristown", multiplier: 1.10 },
  "07054": { label: "Parsippany", multiplier: 1.02 },
  "07601": { label: "Hackensack", multiplier: 0.98 },
  "07024": { label: "Fort Lee", multiplier: 1.05 },
  "07302": { label: "Jersey City", multiplier: 1.08 },
  "07030": { label: "Hoboken", multiplier: 1.15 },
  "07666": { label: "Teaneck", multiplier: 1.04 },
  "07410": { label: "Fair Lawn", multiplier: 1.0 },
  "07631": { label: "Englewood", multiplier: 1.06 },
  "07110": { label: "Nutley", multiplier: 1.0 },
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

/* ─── Component ─── */
export default function PropertyRenovationReport() {
  const [address, setAddress] = useState("");
  const [reportReady, setReportReady] = useState(false);
  const [property, setProperty] = useState<PropertySnapshot>(EMPTY_SNAPSHOT);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<typeof TOWN_INDEX>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTown, setSelectedTown] = useState<(typeof TOWN_INDEX)[0] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value.trim().length >= 2) {
      // Search town names and ZIP codes
      const results = fuse.search(value.trim()).slice(0, 6);
      setSuggestions(results.map((r) => r.item));
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectTown = (town: (typeof TOWN_INDEX)[0]) => {
    setSelectedTown(town);
    setAddress((prev) => {
      // If user typed a street address, keep it and append town
      const hasStreet = /\d/.test(prev.split(",")[0] || "");
      if (hasStreet) {
        return `${prev.split(",")[0].trim()}, ${town.name}, NJ ${town.zip}`;
      }
      return `${town.name}, NJ ${town.zip}`;
    });
    setProperty((p) => ({
      ...p,
      town: town.name,
      zip: town.zip,
    }));
    setShowSuggestions(false);
  };

  const handleAnalyze = () => {
    if (!address.trim()) return;

    // Try to extract ZIP from address if no town was selected
    if (!selectedTown) {
      const zipMatch = address.match(/\b(0\d{4})\b/);
      if (zipMatch) {
        const foundTown = TOWN_INDEX.find((t) => t.allZips.includes(zipMatch[1]));
        if (foundTown) {
          setSelectedTown(foundTown);
          setProperty((p) => ({ ...p, town: foundTown.name, zip: foundTown.zip }));
        } else {
          setProperty((p) => ({ ...p, zip: zipMatch[1] }));
        }
      }
      // Try to match town name from address
      if (!zipMatch) {
        const results = fuse.search(address.trim());
        if (results.length > 0) {
          const best = results[0].item;
          setSelectedTown(best);
          setProperty((p) => ({ ...p, town: best.name, zip: best.zip }));
        }
      }
    }

    setReportReady(true);
    setSelectedScopes([]);
  };

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

  const filledCount = Object.values(property).filter(Boolean).length;
  const totalFields = Object.keys(property).length;

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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-10 mx-auto max-w-lg relative">
              <div className="flex rounded-2xl border-2 border-border bg-background shadow-xl shadow-foreground/5 overflow-hidden focus-within:border-foreground/30 transition-colors">
                <div className="flex items-center pl-4 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none"
                  placeholder="Type your address, town, or ZIP code..."
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowSuggestions(false);
                      handleAnalyze();
                    }
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!address.trim()}
                  className="m-1.5 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Autocomplete dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border-2 border-border bg-background shadow-2xl shadow-foreground/10 overflow-hidden"
                  >
                    {suggestions.map((town, i) => (
                      <button
                        key={`${town.slug}-${i}`}
                        onClick={() => handleSelectTown(town)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{town.name}, NJ</p>
                          <p className="text-xs text-muted-foreground">{town.county} · {town.zip}</p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 font-mono">{town.zip}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-3 text-xs text-muted-foreground">
                Serving Bergen, Passaic, Morris, Essex & Hudson counties · Start typing a town name or ZIP
              </p>
            </motion.div>
          </div>
        </section>

        <AnimatePresence>
          {reportReady && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* ───── Property Snapshot — always editable ───── */}
              <section className="border-t border-border/50 bg-muted/20">
                <div className="mx-auto max-w-5xl px-6 py-16">
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Home Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTown
                        ? <>We identified <strong>{selectedTown.name}</strong> in <strong>{selectedTown.county}</strong>. Fill in your property details below to refine cost estimates.</>
                        : "Enter your property details below to get personalized renovation cost ranges."
                      }
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden max-w-[200px]">
                        <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${(filledCount / totalFields) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{filledCount}/{totalFields} fields</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {snapshotFields.map((field) => {
                      const Icon = field.icon;
                      const isAutoFilled = (field.key === "town" || field.key === "zip") && selectedTown && property[field.key];
                      return (
                        <Card key={field.key} className={`border transition-all ${isAutoFilled ? "border-foreground/20 bg-foreground/[0.02]" : "border-border/60 bg-background"} shadow-none`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium uppercase tracking-wider">{field.label}</span>
                              {isAutoFilled && <CheckCircle2 className="h-3 w-3 text-foreground/50 ml-auto" />}
                            </div>
                            <Input
                              className="h-8 text-sm border-border/50"
                              placeholder={field.placeholder}
                              value={property[field.key]}
                              onChange={(e) => setProperty((p) => ({ ...p, [field.key]: e.target.value }))}
                            />
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
