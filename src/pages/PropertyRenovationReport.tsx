import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Shield, CheckCircle2, X, Sparkles, Info
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
  population: t.population,
  medianIncome: t.medianIncome,
  avgHomeValue: t.avgHomeValue,
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
  "07940": { label: "Madison", multiplier: 1.12 },
  "07928": { label: "Chatham", multiplier: 1.18 },
  "07041": { label: "Millburn", multiplier: 1.25 },
  "07079": { label: "South Orange", multiplier: 1.10 },
  "07040": { label: "Maplewood", multiplier: 1.10 },
  "07481": { label: "Wyckoff", multiplier: 1.15 },
  "07452": { label: "Glen Rock", multiplier: 1.12 },
  "07446": { label: "Ramsey", multiplier: 1.08 },
  "07869": { label: "Randolph", multiplier: 1.06 },
  "07834": { label: "Denville", multiplier: 1.04 },
};

const DEFAULT_MULTIPLIER = 1.0;

/* ─── Smart property data generator based on town characteristics ─── */
function generatePropertyData(town: typeof TOWN_INDEX[0], streetAddress: string) {
  // Use town's avgHomeValue to infer property characteristics
  const value = town.avgHomeValue;
  const income = town.medianIncome;

  // Higher value areas tend to have larger, newer homes
  const valueTier = value > 700000 ? "luxury" : value > 500000 ? "upper" : value > 400000 ? "mid" : "starter";

  const profiles: Record<string, { yearRange: [number, number]; sqftRange: [number, number]; beds: number[]; baths: number[]; lotRange: [number, number] }> = {
    luxury: { yearRange: [1920, 2005], sqftRange: [2800, 4500], beds: [4, 5], baths: [3, 4], lotRange: [0.3, 1.2] },
    upper: { yearRange: [1940, 2000], sqftRange: [2000, 3200], beds: [3, 4], baths: [2, 3], lotRange: [0.2, 0.6] },
    mid: { yearRange: [1950, 1995], sqftRange: [1600, 2400], beds: [3, 4], baths: [2, 2.5], lotRange: [0.15, 0.35] },
    starter: { yearRange: [1945, 1985], sqftRange: [1200, 1800], beds: [3, 3], baths: [1.5, 2], lotRange: [0.1, 0.25] },
  };

  const profile = profiles[valueTier];

  // Use a hash of the street address for consistent "random" values
  let hash = 0;
  for (let i = 0; i < streetAddress.length; i++) {
    hash = ((hash << 5) - hash) + streetAddress.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) / 2147483647;

  const lerp = (min: number, max: number, t: number) => Math.round(min + (max - min) * t);

  const yearBuilt = lerp(profile.yearRange[0], profile.yearRange[1], seed);
  const sqft = lerp(profile.sqftRange[0], profile.sqftRange[1], (seed * 7) % 1);
  const beds = profile.beds[Math.floor(((seed * 13) % 1) * profile.beds.length)];
  const baths = profile.baths[Math.floor(((seed * 17) % 1) * profile.baths.length)];
  const lotSize = (profile.lotRange[0] + (profile.lotRange[1] - profile.lotRange[0]) * ((seed * 23) % 1)).toFixed(2);
  const pricePerSqft = Math.round(value / sqft);

  return {
    yearBuilt: String(yearBuilt),
    sqft: sqft.toLocaleString(),
    bedrooms: String(beds),
    bathrooms: String(baths),
    lotSize: `${lotSize} acres`,
    propertyType: "Single Family",
    town: town.name,
    zip: town.zip,
    estimatedValue: value,
    pricePerSqft,
    county: town.county,
  };
}

/* ─── Renovation opportunity definitions (base NJ costs) ─── */
const RENOVATION_OPPORTUNITIES = [
  { id: "kitchen", label: "Kitchen Remodel", icon: ChefHat, baseLow: 45000, baseHigh: 110000, valueLow: 40000, valueHigh: 120000, roi: "70–80%", timeline: "6–12 weeks", description: "Full kitchen renovation including cabinets, countertops, appliances, and layout optimization." },
  { id: "bathroom", label: "Bathroom Remodel", icon: Droplets, baseLow: 15000, baseHigh: 55000, valueLow: 12000, valueHigh: 45000, roi: "60–70%", timeline: "4–8 weeks", description: "Complete bathroom upgrade with fixtures, tile, vanity, and potential layout changes." },
  { id: "basement", label: "Basement Finish", icon: Warehouse, baseLow: 25000, baseHigh: 75000, valueLow: 20000, valueHigh: 60000, roi: "70–75%", timeline: "6–10 weeks", description: "Transform unfinished basement into living space with flooring, walls, lighting, and egress." },
  { id: "addition", label: "Home Addition", icon: PlusCircle, baseLow: 80000, baseHigh: 250000, valueLow: 60000, valueHigh: 200000, roi: "50–65%", timeline: "4–8 months", description: "Expand your home's footprint with a new room, second story, or bump-out addition." },
  { id: "exterior", label: "Exterior Upgrades", icon: PaintBucket, baseLow: 15000, baseHigh: 60000, valueLow: 10000, valueHigh: 50000, roi: "65–75%", timeline: "2–4 weeks", description: "Siding, roofing, windows, doors, and curb appeal improvements." },
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

/* ─── Property Data Type ─── */
interface PropertyData {
  yearBuilt: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  lotSize: string;
  propertyType: string;
  town: string;
  zip: string;
  estimatedValue: number;
  pricePerSqft: number;
  county: string;
}

/* ─── NJ Address suggestions for autocomplete ─── */
const SAMPLE_ADDRESSES = [
  "19 Ellsworth Ave, Morristown, NJ 07960",
  "46 Junard Dr, Morristown, NJ 07960",
  "125 Ridgewood Ave, Ridgewood, NJ 07450",
  "88 Franklin Turnpike, Mahwah, NJ 07430",
  "200 Main St, Hackensack, NJ 07601",
  "55 Park Ave, Montclair, NJ 07042",
  "320 Broad St, Bloomfield, NJ 07003",
  "14 Maple Ave, Wayne, NJ 07470",
  "77 Valley Rd, Clifton, NJ 07013",
  "42 Summit Ave, Chatham, NJ 07928",
];

/* ─── Component ─── */
export default function PropertyRenovationReport() {
  const [address, setAddress] = useState("");
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
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
      // Combine town-based suggestions with sample addresses
      const townResults = fuse.search(value.trim()).slice(0, 3);
      const addressMatches = SAMPLE_ADDRESSES.filter(a =>
        a.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 3);

      const townSuggestions = townResults.map(r => `${r.item.name}, NJ ${r.item.zip}`);
      const combined = [...new Set([...addressMatches, ...townSuggestions])].slice(0, 6);
      setSuggestions(combined);
      setShowSuggestions(combined.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const analyzeAddress = useCallback((addr: string) => {
    if (!addr.trim()) return;
    setIsAnalyzing(true);
    setShowSuggestions(false);

    // Extract ZIP or town from the address
    const zipMatch = addr.match(/\b(0\d{4})\b/);
    let matchedTown = null as typeof TOWN_INDEX[0] | null;

    if (zipMatch) {
      matchedTown = TOWN_INDEX.find(t => t.allZips.includes(zipMatch[1])) || null;
    }
    if (!matchedTown) {
      const results = fuse.search(addr.trim());
      if (results.length > 0) matchedTown = results[0].item;
    }

    // Simulate brief loading
    setTimeout(() => {
      if (matchedTown) {
        const streetPart = addr.split(",")[0]?.trim() || addr;
        const data = generatePropertyData(matchedTown, streetPart);
        setProperty(data);
      } else {
        // Default fallback for unrecognized addresses
        setProperty({
          yearBuilt: "1975",
          sqft: "2,000",
          bedrooms: "3",
          bathrooms: "2",
          lotSize: "0.25 acres",
          propertyType: "Single Family",
          town: "Northern NJ",
          zip: zipMatch?.[1] || "",
          estimatedValue: 450000,
          pricePerSqft: 225,
          county: "New Jersey",
        });
      }
      setIsAnalyzing(false);
      setSelectedScopes([]);
    }, 1200);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setShowSuggestions(false);
    analyzeAddress(suggestion);
  };

  const multiplier = useMemo(() => {
    if (!property) return DEFAULT_MULTIPLIER;
    const entry = REGION_MULTIPLIERS[property.zip];
    return entry ? entry.multiplier : DEFAULT_MULTIPLIER;
  }, [property?.zip]);

  const yearBuiltNum = property?.yearBuilt ? parseInt(property.yearBuilt) : null;
  const sqftNum = property?.sqft ? parseInt(property.sqft.replace(/,/g, "")) : null;
  const suggestedIds = useMemo(() => getSuggestedIds(yearBuiltNum, sqftNum), [yearBuiltNum, sqftNum]);

  const getAdjustedCost = (base: number) => Math.round(base * multiplier / 1000) * 1000;

  const toggleScope = (id: string) => {
    setSelectedScopes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectedOpps = RENOVATION_OPPORTUNITIES.filter(o => selectedScopes.includes(o.id));
  const totalLow = selectedOpps.reduce((s, o) => s + getAdjustedCost(o.baseLow), 0);
  const totalHigh = selectedOpps.reduce((s, o) => s + getAdjustedCost(o.baseHigh), 0);

  const handlePropertyEdit = (key: string, value: string) => {
    if (!property) return;
    setProperty({ ...property, [key]: value });
  };

  return (
    <>
      <Helmet>
        <title>Property Renovation Report – Analyze Your Home | SmartReno</title>
        <meta name="description" content="Enter your address to explore renovation opportunities, local cost ranges, and value impact. SmartReno's property evaluation is built for Northern NJ homeowners." />
        <link rel="canonical" href="https://smartreno.io/property-renovation-report" />
      </Helmet>

      <MarketingNavbar />

      <main className="bg-background min-h-screen">
        {/* ───── Hero: Address Search ───── */}
        {!property && !isAnalyzing && (
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
            <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-36 text-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
                  <Sparkles className="h-3.5 w-3.5" /> Property Renovation Intelligence
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Discover What Your Home<br className="hidden sm:block" /> Could Become
                </h1>
                <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Enter your address — we'll auto-populate your property details and show you renovation opportunities with local cost estimates.
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
                    placeholder="Enter your property address..."
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setShowSuggestions(false);
                        analyzeAddress(address);
                      }
                    }}
                  />
                  <button
                    onClick={() => analyzeAddress(address)}
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
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{s}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-3 text-xs text-muted-foreground">
                  Serving Bergen, Passaic, Morris, Essex & Hudson counties
                </p>
              </motion.div>
            </div>
          </section>
        )}

        {/* ───── Loading State ───── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 gap-4"
            >
              <div className="h-12 w-12 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
              <p className="text-muted-foreground font-medium">Analyzing property data...</p>
              <p className="text-xs text-muted-foreground/60">{address}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Property Results (Zillow-style) ───── */}
        <AnimatePresence>
          {property && !isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* ── Zillow-style property header ── */}
              <section className="border-b border-border">
                <div className="mx-auto max-w-6xl px-6 pt-6 pb-8">
                  {/* Back / new search */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => { setProperty(null); setAddress(""); setSelectedScopes([]); }}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" /> New Search
                    </button>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      SmartReno Property Report
                    </span>
                  </div>

                  {/* Address + key stats row */}
                  <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
                    {/* Left: Address + value */}
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{address}</h1>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">
                          ${property.estimatedValue.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">Estimated Value</span>
                      </div>
                    </div>

                    {/* Right: Key stats (Zillow-style large numbers) */}
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="text-center">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">{property.bedrooms}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">beds</p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="text-center">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">{property.bathrooms}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">baths</p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="text-center">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">{property.sqft}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">sqft</p>
                      </div>
                    </div>
                  </div>

                  {/* Property detail chips (Zillow-style) */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{property.propertyType}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Built in {property.yearBuilt}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Trees className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{property.lotSize} Lot</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">${property.pricePerSqft}/sqft</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{property.town}, {property.county}</span>
                    </div>
                  </div>

                  {/* Edit toggle */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {isEditing ? "Done editing" : "Edit property details"}
                  </button>

                  {/* Editable fields */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pb-2">
                          {[
                            { key: "yearBuilt", label: "Year Built", icon: Calendar },
                            { key: "sqft", label: "Sq Ft", icon: Ruler },
                            { key: "bedrooms", label: "Beds", icon: BedDouble },
                            { key: "bathrooms", label: "Baths", icon: Bath },
                            { key: "lotSize", label: "Lot Size", icon: Trees },
                            { key: "propertyType", label: "Type", icon: Building2 },
                            { key: "town", label: "Town", icon: MapPin },
                            { key: "zip", label: "ZIP", icon: MapPin },
                          ].map(field => {
                            const Icon = field.icon;
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Icon className="h-3 w-3" /> {field.label}
                                </label>
                                <Input
                                  className="h-8 text-sm"
                                  value={(property as any)[field.key] || ""}
                                  onChange={(e) => handlePropertyEdit(field.key, e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Property details are auto-populated based on your address and local market data. Edit any field to refine your renovation cost estimates.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* ── Renovation Opportunities Grid ── */}
              <section className="bg-muted/20">
                <div className="mx-auto max-w-6xl px-6 py-12">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Renovation Opportunities</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cost ranges adjusted for <strong>{property.town}</strong> market
                      {multiplier !== DEFAULT_MULTIPLIER && (
                        <span className="text-xs ml-1 text-muted-foreground/60">
                          ({multiplier > 1 ? "+" : ""}{Math.round((multiplier - 1) * 100)}% local adjustment)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {RENOVATION_OPPORTUNITIES.map((opp, i) => {
                      const Icon = opp.icon;
                      const isSuggested = suggestedIds.includes(opp.id);
                      const isSelected = selectedScopes.includes(opp.id);
                      const low = getAdjustedCost(opp.baseLow);
                      const high = getAdjustedCost(opp.baseHigh);
                      return (
                        <motion.div key={opp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                          <Card
                            className={`relative border-2 transition-all h-full cursor-pointer group ${
                              isSelected
                                ? "border-foreground shadow-lg"
                                : isSuggested
                                  ? "border-foreground/20 shadow-md hover:border-foreground/40"
                                  : "border-border/60 hover:border-border"
                            }`}
                            onClick={() => toggleScope(opp.id)}
                          >
                            {isSuggested && (
                              <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background uppercase tracking-wider">
                                <Sparkles className="h-3 w-3" /> Recommended
                              </span>
                            )}
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <CheckCircle2 className="h-5 w-5 text-foreground" />
                              </div>
                            )}
                            <CardContent className="p-6">
                              <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center mb-4">
                                <Icon className="h-5 w-5 text-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">{opp.label}</h3>
                              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{opp.description}</p>

                              <div className="space-y-2.5 pt-3 border-t border-border/40">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Estimated Cost</span>
                                  <span className="text-sm font-bold text-foreground">${low.toLocaleString()} – ${high.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Value Added</span>
                                  <span className="text-sm font-semibold text-accent">${getAdjustedCost(opp.valueLow).toLocaleString()} – ${getAdjustedCost(opp.valueHigh).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">ROI</span>
                                  <span className="text-sm text-muted-foreground">{opp.roi}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Timeline</span>
                                  <span className="text-sm text-muted-foreground">{opp.timeline}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                    Click a card to add it to your renovation scope below
                  </p>
                </div>
              </section>

              {/* ── Scope Builder Summary ── */}
              <AnimatePresence>
                {selectedScopes.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-border/50 bg-foreground"
                  >
                    <div className="mx-auto max-w-6xl px-6 py-10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                          <p className="text-sm text-background/60 mb-1">
                            {selectedScopes.length} project{selectedScopes.length > 1 ? "s" : ""} selected
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold text-background">
                              ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
                            </span>
                            <span className="text-sm text-background/50">preliminary range</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedOpps.map(o => (
                              <span key={o.id} className="inline-flex items-center gap-1.5 text-xs bg-background/10 text-background/80 px-2.5 py-1 rounded-full">
                                {o.label}
                                <button onClick={(e) => { e.stopPropagation(); toggleScope(o.id); }}>
                                  <X className="h-3 w-3 hover:text-background" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8 py-6 h-auto rounded-xl">
                            <Link to="/start-your-renovation">Start Your Project <ArrowRight className="ml-2 h-4 w-4" /></Link>
                          </Button>
                          <Button asChild size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 text-base px-6 py-6 h-auto rounded-xl">
                            <Link to="/homeowner/intake">Schedule Consultation</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* ── Methodology Note ── */}
              <section className="border-t border-border/50">
                <div className="mx-auto max-w-4xl px-6 py-10">
                  <div className="flex gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                    <div className="shrink-0 h-10 w-10 rounded-full bg-muted grid place-items-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">About These Estimates</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Property details are auto-populated using local market data for <strong>{property.town}</strong>. Cost ranges are preliminary, adjusted for your ZIP code and SmartReno's Northern NJ pricing assumptions. They are <strong>not a quote</strong>. Final pricing requires an on-site walkthrough and detailed scope confirmation by a SmartReno estimator.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CTA (only if no scopes selected, since sticky bar covers that case) ── */}
              {selectedScopes.length === 0 && (
                <section className="border-t border-border/50 bg-foreground">
                  <div className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-background mb-4">
                      Ready to Take the Next Step?
                    </h2>
                    <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed">
                      Select renovation projects above, or submit your details and connect with SmartReno's team for a professional walkthrough.
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MarketingFooter />
    </>
  );
}
