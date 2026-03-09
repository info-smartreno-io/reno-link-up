import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Home, DollarSign, TrendingUp, ArrowRight, MapPin,
  Bath, BedDouble, Ruler, Calendar, Trees, Building2, Pencil,
  ChefHat, Droplets, Warehouse, PlusCircle, PaintBucket,
  Shield, CheckCircle2, X, Sparkles, Info, Phone, Clock,
  Hammer, Zap, Layers, ChevronDown, ChevronUp, AlertTriangle
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

/* ─── Smart property data generator ─── */
function generatePropertyData(town: typeof TOWN_INDEX[0], streetAddress: string) {
  const value = town.avgHomeValue;
  const valueTier = value > 700000 ? "luxury" : value > 500000 ? "upper" : value > 400000 ? "mid" : "starter";

  const profiles: Record<string, { yearRange: [number, number]; sqftRange: [number, number]; beds: number[]; baths: number[]; lotRange: [number, number] }> = {
    luxury: { yearRange: [1920, 2005], sqftRange: [2800, 4500], beds: [4, 5], baths: [3, 4], lotRange: [0.3, 1.2] },
    upper: { yearRange: [1940, 2000], sqftRange: [2000, 3200], beds: [3, 4], baths: [2, 3], lotRange: [0.2, 0.6] },
    mid: { yearRange: [1950, 1995], sqftRange: [1600, 2400], beds: [3, 4], baths: [2, 2.5], lotRange: [0.15, 0.35] },
    starter: { yearRange: [1945, 1985], sqftRange: [1200, 1800], beds: [3, 3], baths: [1.5, 2], lotRange: [0.1, 0.25] },
  };

  const profile = profiles[valueTier];
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

/* ─── Cost Code Definitions ─── */
interface CostLineItem {
  costCode: string;
  description: string;
  unit: string;
  qtyFormula: (sqft: number, baths: number, beds: number) => number;
  unitCostLow: number;
  unitCostHigh: number;
}

interface RenovationCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  roi: string;
  timeline: string;
  description: string;
  lineItems: CostLineItem[];
}

/* ─── Detailed takeoff-based renovation categories ─── */
const RENOVATION_CATEGORIES: RenovationCategory[] = [
  {
    id: "kitchen",
    label: "Kitchen Remodel",
    icon: ChefHat,
    roi: "70–80%",
    timeline: "8–14 weeks",
    description: "Complete kitchen renovation with modern finishes, optimized layout, and updated systems.",
    lineItems: [
      { costCode: "02-410", description: "Selective Demolition – Kitchen", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.12), unitCostLow: 3, unitCostHigh: 6 },
      { costCode: "06-200", description: "Cabinetry (supply & install)", unit: "LF", qtyFormula: (sqft) => Math.round(sqft * 0.011 + 6), unitCostLow: 550, unitCostHigh: 700 },
      { costCode: "12-361", description: "Countertops – Quartz/Granite", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.018 + 5), unitCostLow: 55, unitCostHigh: 80 },
      { costCode: "09-300", description: "Tile Backsplash", unit: "SF", qtyFormula: () => 30, unitCostLow: 14, unitCostHigh: 28 },
      { costCode: "09-650", description: "Flooring – Kitchen (LVP/Tile)", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.12), unitCostLow: 6, unitCostHigh: 12 },
      { costCode: "15-400", description: "Plumbing – Rough-in, Sink & Dishwasher Lines", unit: "EA", qtyFormula: () => 2, unitCostLow: 900, unitCostHigh: 1800 },
      { costCode: "05-120", description: "Structural – Beam/Header (wall relocation, if applicable)", unit: "LS", qtyFormula: () => 1, unitCostLow: 1500, unitCostHigh: 4500 },
      { costCode: "16-100", description: "Electrical – Circuits, Lighting, Outlets", unit: "EA", qtyFormula: () => 1, unitCostLow: 2500, unitCostHigh: 4500 },
      { costCode: "11-450", description: "Appliance Package (range, fridge, DW, micro)", unit: "LS", qtyFormula: () => 1, unitCostLow: 3500, unitCostHigh: 6500 },
      { costCode: "09-900", description: "Painting – Kitchen Walls & Ceiling", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.12 * 3), unitCostLow: 2, unitCostHigh: 3.5 },
      { costCode: "01-500", description: "Permits & Inspections", unit: "LS", qtyFormula: () => 1, unitCostLow: 500, unitCostHigh: 1500 },
    ],
  },
  {
    id: "bathroom",
    label: "Bathroom Remodel (per bath)",
    icon: Droplets,
    roi: "60–70%",
    timeline: "4–6 weeks per bath",
    description: "Full bathroom gut renovation with modern fixtures, waterproofing, and tile work.",
    lineItems: [
      { costCode: "02-410", description: "Selective Demolition – Bathroom", unit: "SF", qtyFormula: (_s, baths) => Math.round(55 * Math.max(baths, 1)), unitCostLow: 5, unitCostHigh: 9 },
      { costCode: "07-100", description: "Waterproofing Membrane (Kerdi/RedGard)", unit: "SF", qtyFormula: (_s, baths) => Math.round(100 * Math.max(baths, 1)), unitCostLow: 4, unitCostHigh: 7 },
      { costCode: "09-310", description: "Wall Tile – Shower/Tub Surround", unit: "SF", qtyFormula: (_s, baths) => Math.round(75 * Math.max(baths, 1)), unitCostLow: 12, unitCostHigh: 25 },
      { costCode: "09-650", description: "Floor Tile – Bathroom", unit: "SF", qtyFormula: (_s, baths) => Math.round(55 * Math.max(baths, 1)), unitCostLow: 10, unitCostHigh: 20 },
      { costCode: "22-400", description: "Vanity w/ Top (supply & install)", unit: "EA", qtyFormula: (_s, baths) => Math.max(baths, 1), unitCostLow: 800, unitCostHigh: 2200 },
      { costCode: "22-420", description: "Toilet (supply & install)", unit: "EA", qtyFormula: (_s, baths) => Math.max(baths, 1), unitCostLow: 350, unitCostHigh: 700 },
      { costCode: "22-430", description: "Shower Valve & Trim Kit", unit: "EA", qtyFormula: (_s, baths) => Math.max(baths, 1), unitCostLow: 450, unitCostHigh: 1200 },
      { costCode: "22-440", description: "Shower Glass Enclosure", unit: "EA", qtyFormula: (_s, baths) => Math.round(Math.max(baths, 1) * 0.5), unitCostLow: 900, unitCostHigh: 2200 },
      { costCode: "15-400", description: "Plumbing – Rough-in, Supply & Drain Lines", unit: "EA", qtyFormula: (_s, baths) => Math.max(baths, 1), unitCostLow: 1200, unitCostHigh: 2800 },
      { costCode: "16-100", description: "Electrical – Exhaust Fan, GFCI, Lighting", unit: "EA", qtyFormula: (_s, baths) => Math.max(baths, 1), unitCostLow: 800, unitCostHigh: 1800 },
      { costCode: "09-900", description: "Painting – Bathroom Walls & Ceiling", unit: "SF", qtyFormula: (_s, baths) => Math.round(160 * Math.max(baths, 1)), unitCostLow: 2, unitCostHigh: 3.5 },
    ],
  },
  {
    id: "flooring",
    label: "Whole-Home Flooring",
    icon: Layers,
    roi: "70–80%",
    timeline: "2–4 weeks",
    description: "Replace flooring throughout the home. Costs calculated from actual square footage minus bathrooms and kitchen.",
    lineItems: [
      { costCode: "02-410", description: "Remove Existing Flooring", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.70), unitCostLow: 1.25, unitCostHigh: 2.5 },
      { costCode: "09-640", description: "Subfloor Prep & Leveling", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.70 * 0.25), unitCostLow: 1.5, unitCostHigh: 3.5 },
      { costCode: "09-651", description: "Hardwood / Engineered Hardwood (supply & install)", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.50), unitCostLow: 6, unitCostHigh: 12 },
      { costCode: "09-652", description: "LVP / Tile – Wet Areas & Entry", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.15), unitCostLow: 5, unitCostHigh: 10 },
      { costCode: "09-660", description: "Carpet – Bedrooms (if applicable)", unit: "SF", qtyFormula: (_sqft, _b, beds) => Math.round(beds * 150), unitCostLow: 3, unitCostHigh: 7 },
      { costCode: "06-220", description: "Baseboard & Trim (supply & install)", unit: "LF", qtyFormula: (sqft) => Math.round(Math.sqrt(sqft) * 7), unitCostLow: 4, unitCostHigh: 9 },
      { costCode: "09-670", description: "Transitions & Thresholds", unit: "EA", qtyFormula: (_s, _b, beds) => beds + 3, unitCostLow: 35, unitCostHigh: 85 },
    ],
  },
  {
    id: "basement",
    label: "Basement Finish",
    icon: Warehouse,
    roi: "70–75%",
    timeline: "8–12 weeks",
    description: "Transform unfinished basement into living space with proper egress, moisture control, and finishes.",
    lineItems: [
      { costCode: "07-110", description: "Moisture Barrier & Waterproofing", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.40), unitCostLow: 2, unitCostHigh: 5 },
      { costCode: "06-160", description: "Framing – Walls & Soffits", unit: "LF", qtyFormula: (sqft) => Math.round(Math.sqrt(sqft * 0.40) * 5), unitCostLow: 10, unitCostHigh: 20 },
      { costCode: "07-210", description: "Insulation – Rigid Foam / Batt", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.40 * 1.3), unitCostLow: 1.5, unitCostHigh: 3.5 },
      { costCode: "09-290", description: "Drywall – Walls & Ceiling", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.40 * 2.8), unitCostLow: 2.5, unitCostHigh: 4.5 },
      { costCode: "09-650", description: "Flooring – Basement (LVP/Epoxy)", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.40), unitCostLow: 5, unitCostHigh: 10 },
      { costCode: "16-100", description: "Electrical – Lighting, Outlets, Panel Upgrade", unit: "LS", qtyFormula: () => 1, unitCostLow: 3500, unitCostHigh: 7000 },
      { costCode: "23-300", description: "HVAC Extension – Ductwork or Mini-Split", unit: "LS", qtyFormula: () => 1, unitCostLow: 2500, unitCostHigh: 5500 },
      { costCode: "08-310", description: "Egress Window (if required)", unit: "EA", qtyFormula: () => 1, unitCostLow: 2500, unitCostHigh: 5000 },
      { costCode: "09-900", description: "Painting – Basement", unit: "SF", qtyFormula: (sqft) => Math.round(sqft * 0.40 * 2.8), unitCostLow: 1.75, unitCostHigh: 3.5 },
      { costCode: "01-500", description: "Permits & Inspections", unit: "LS", qtyFormula: () => 1, unitCostLow: 800, unitCostHigh: 2500 },
    ],
  },
  {
    id: "exterior",
    label: "Exterior Upgrades",
    icon: PaintBucket,
    roi: "65–80%",
    timeline: "2–6 weeks",
    description: "Roofing, siding, windows, and curb appeal improvements based on home exterior area.",
    lineItems: [
      { costCode: "07-310", description: "Roofing – Architectural Shingle (tear-off & install)", unit: "SQ", qtyFormula: (sqft) => Math.round(sqft / 100 * 1.1), unitCostLow: 350, unitCostHigh: 650 },
      { costCode: "07-460", description: "Siding – Vinyl/Fiber Cement", unit: "SF", qtyFormula: (sqft) => Math.round(Math.sqrt(sqft) * 24), unitCostLow: 6, unitCostHigh: 13 },
      { costCode: "08-520", description: "Window Replacement (double-hung, vinyl/fiberglass)", unit: "EA", qtyFormula: (_s, _b, beds) => beds * 3 + 3, unitCostLow: 500, unitCostHigh: 1000 },
      { costCode: "08-110", description: "Entry Door – Fiberglass/Steel", unit: "EA", qtyFormula: () => 1, unitCostLow: 1500, unitCostHigh: 3500 },
      { costCode: "03-300", description: "Walkway / Stoop Repair", unit: "SF", qtyFormula: () => 60, unitCostLow: 10, unitCostHigh: 22 },
      { costCode: "09-900", description: "Exterior Painting / Staining", unit: "SF", qtyFormula: (sqft) => Math.round(Math.sqrt(sqft) * 24), unitCostLow: 2, unitCostHigh: 4.5 },
    ],
  },
];

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

/* ─── NJ Address suggestions ─── */
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

/* ─── Helpers ─── */
function getSuggestedIds(yearBuilt: number | null, sqft: number | null): string[] {
  const suggestions: string[] = [];
  if (yearBuilt && yearBuilt < 1990) suggestions.push("kitchen", "bathroom", "flooring");
  if (yearBuilt && yearBuilt < 1980) suggestions.push("exterior");
  if (sqft && sqft < 1800) suggestions.push("basement");
  return [...new Set(suggestions)];
}

/* ─── Component ─── */
export default function PropertyRenovationReport() {
  const [address, setAddress] = useState("");
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    const zipMatch = addr.match(/\b(0\d{4})\b/);
    let matchedTown = null as typeof TOWN_INDEX[0] | null;

    if (zipMatch) {
      matchedTown = TOWN_INDEX.find(t => t.allZips.includes(zipMatch[1])) || null;
    }
    if (!matchedTown) {
      const results = fuse.search(addr.trim());
      if (results.length > 0) matchedTown = results[0].item;
    }

    setTimeout(() => {
      if (matchedTown) {
        const streetPart = addr.split(",")[0]?.trim() || addr;
        const data = generatePropertyData(matchedTown, streetPart);
        setProperty(data);
      } else {
        setProperty({
          yearBuilt: "1975", sqft: "2,000", bedrooms: "3", bathrooms: "2",
          lotSize: "0.25 acres", propertyType: "Single Family",
          town: "Northern NJ", zip: zipMatch?.[1] || "",
          estimatedValue: 450000, pricePerSqft: 225, county: "New Jersey",
        });
      }
      setIsAnalyzing(false);
      setSelectedScopes([]);
      setExpandedCards([]);
    }, 1200);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setShowSuggestions(false);
    analyzeAddress(suggestion);
  };

  const multiplier = useMemo(() => {
    if (!property) return DEFAULT_MULTIPLIER;
    return REGION_MULTIPLIERS[property.zip]?.multiplier ?? DEFAULT_MULTIPLIER;
  }, [property?.zip]);

  const yearBuiltNum = property?.yearBuilt ? parseInt(property.yearBuilt) : null;
  const sqftNum = property?.sqft ? parseInt(property.sqft.replace(/,/g, "")) : null;
  const bathsNum = property?.bathrooms ? parseFloat(property.bathrooms) : 2;
  const bedsNum = property?.bedrooms ? parseInt(property.bedrooms) : 3;
  const suggestedIds = useMemo(() => getSuggestedIds(yearBuiltNum, sqftNum), [yearBuiltNum, sqftNum]);

  const GC_MARKUP = 1.25; // 25% General Contractor overhead & profit
  const adj = (val: number) => Math.round(val * multiplier * GC_MARKUP);

  const getCategoryTotal = (cat: RenovationCategory): { low: number; high: number } => {
    let low = 0, high = 0;
    for (const item of cat.lineItems) {
      const qty = item.qtyFormula(sqftNum || 2000, bathsNum, bedsNum);
      low += adj(qty * item.unitCostLow);
      high += adj(qty * item.unitCostHigh);
    }
    // Tighter range: raise low by 15%, lower high by 10%
    const tightLow = Math.round(low * 1.15 / 500) * 500;
    const tightHigh = Math.round(high * 0.90 / 500) * 500;
    return { low: tightLow, high: Math.max(tightHigh, tightLow + 500) };
  };

  const toggleScope = (id: string) => {
    setSelectedScopes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const CONTINGENCY = 0.10; // 10% buffer for unforeseen extras
  const selectedCats = RENOVATION_CATEGORIES.filter(c => selectedScopes.includes(c.id));
  const subtotalLow = selectedCats.reduce((s, c) => s + getCategoryTotal(c).low, 0);
  const subtotalHigh = selectedCats.reduce((s, c) => s + getCategoryTotal(c).high, 0);
  const contingencyLow = Math.round(subtotalLow * CONTINGENCY / 100) * 100;
  const contingencyHigh = Math.round(subtotalHigh * CONTINGENCY / 100) * 100;
  const totalLow = subtotalLow + contingencyLow;
  const totalHigh = subtotalHigh + contingencyHigh;

  const handlePropertyEdit = (key: string, value: string) => {
    if (!property) return;
    setProperty({ ...property, [key]: value });
  };

  return (
    <>
      <Helmet>
        <title>Property Renovation Cost Report | SmartReno</title>
        <meta name="description" content="Enter your address for a detailed renovation cost takeoff with cost codes, square footage calculations, and local pricing for Northern NJ." />
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
                  <Sparkles className="h-3.5 w-3.5" /> Renovation Cost Intelligence
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Your Home's Renovation<br className="hidden sm:block" /> Cost Breakdown
                </h1>
                <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Enter your address — we'll auto-populate your property details and generate a detailed cost takeoff with real cost codes and square footage calculations.
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
                      if (e.key === "Enter") { setShowSuggestions(false); analyzeAddress(address); }
                    }}
                  />
                  <button
                    onClick={() => analyzeAddress(address)}
                    disabled={!address.trim()}
                    className="m-1.5 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    Analyze <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div ref={suggestionsRef} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border-2 border-border bg-background shadow-2xl overflow-hidden">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleSelectSuggestion(s)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0">
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

        {/* ───── Loading ───── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="h-12 w-12 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
              <p className="text-muted-foreground font-medium">Generating cost takeoff...</p>
              <p className="text-xs text-muted-foreground/60">{address}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Property Results ───── */}
        <AnimatePresence>
          {property && !isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* ── Property header ── */}
              <section className="border-b border-border">
                <div className="mx-auto max-w-6xl px-6 pt-6 pb-8">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => { setProperty(null); setAddress(""); setSelectedScopes([]); setExpandedCards([]); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" /> New Search
                    </button>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">SmartReno Property Report</span>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{address}</h1>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">${property.estimatedValue.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">Estimated Value</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:gap-10">
                      {[
                        { val: property.bedrooms, label: "beds" },
                        { val: property.bathrooms, label: "baths" },
                        { val: property.sqft, label: "sqft" },
                      ].map((stat, i) => (
                        <React.Fragment key={stat.label}>
                          {i > 0 && <div className="h-10 w-px bg-border" />}
                          <div className="text-center">
                            <span className="text-3xl sm:text-4xl font-bold text-foreground">{stat.val}</span>
                            <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {[
                      { icon: Building2, text: property.propertyType },
                      { icon: Calendar, text: `Built in ${property.yearBuilt}` },
                      { icon: Trees, text: `${property.lotSize} Lot` },
                      { icon: DollarSign, text: `$${property.pricePerSqft}/sqft` },
                      { icon: MapPin, text: `${property.town}, ${property.county}` },
                    ].map((chip) => (
                      <div key={chip.text} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <chip.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{chip.text}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setIsEditing(!isEditing)} className="mt-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                    <Pencil className="h-3 w-3" />
                    {isEditing ? "Done editing" : "Edit property details"}
                  </button>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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
                          ].map(field => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs text-muted-foreground flex items-center gap-1">
                                <field.icon className="h-3 w-3" /> {field.label}
                              </label>
                              <Input className="h-8 text-sm" value={(property as any)[field.key] || ""} onChange={(e) => handlePropertyEdit(field.key, e.target.value)} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">Edit any field to recalculate quantities and costs in real time.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* ── Inline CTA Banner ── */}
              <section className="bg-primary/5 border-b border-border">
                <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ready for accurate numbers? Let us scope your project.</p>
                      <p className="text-xs text-muted-foreground">Fill out the form and a construction agent will visit your home to scope the work and get you 3 qualified bids.</p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0 gap-2">
                    <Link to="/start-your-renovation">
                      Start Your Project <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </section>

              {/* ── Renovation Cost Takeoff Grid ── */}
              <section className="bg-muted/20">
                <div className="mx-auto max-w-6xl px-6 py-12">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Detailed Renovation Cost Takeoff</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Line items calculated from your <strong>{property.sqft} sqft</strong>, <strong>{property.bathrooms} baths</strong>, and <strong>{property.bedrooms} beds</strong> — adjusted for <strong>{property.town}</strong>
                      {multiplier !== DEFAULT_MULTIPLIER && (
                        <span className="text-xs ml-1 text-muted-foreground/60">
                          ({multiplier > 1 ? "+" : ""}{Math.round((multiplier - 1) * 100)}% local adjustment)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid gap-5">
                    {RENOVATION_CATEGORIES.map((cat, i) => {
                      const Icon = cat.icon;
                      const isSuggested = suggestedIds.includes(cat.id);
                      const isSelected = selectedScopes.includes(cat.id);
                      const isExpanded = expandedCards.includes(cat.id);
                      const totals = getCategoryTotal(cat);

                      return (
                        <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                          <Card className={`relative border-2 transition-all ${isSelected ? "border-foreground shadow-lg" : isSuggested ? "border-foreground/20 shadow-md" : "border-border/60"}`}>
                            {isSuggested && (
                              <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background uppercase tracking-wider">
                                <Sparkles className="h-3 w-3" /> Recommended for this home
                              </span>
                            )}

                            <CardContent className="p-0">
                              {/* Card Header */}
                              <div className="flex items-center gap-4 p-6 pb-4 cursor-pointer" onClick={() => toggleScope(cat.id)}>
                                <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center shrink-0">
                                  <Icon className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-foreground">{cat.label}</h3>
                                    {isSelected && <CheckCircle2 className="h-5 w-5 text-foreground shrink-0" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-bold text-foreground">${totals.low.toLocaleString()} – ${totals.high.toLocaleString()}</p>
                                  <div className="flex items-center gap-3 mt-0.5 justify-end">
                                    <span className="text-xs text-muted-foreground">ROI {cat.roi}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {cat.timeline}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Expand toggle */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpand(cat.id); }}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground border-t border-border/40 transition-colors"
                              >
                                <Hammer className="h-3.5 w-3.5" />
                                {isExpanded ? "Hide" : "View"} {cat.lineItems.length} line items
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>

                              {/* Line items table */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="border-t border-border/40">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-muted/50 text-xs text-muted-foreground">
                                              <th className="text-left px-4 py-2.5 font-medium">Cost Code</th>
                                              <th className="text-left px-4 py-2.5 font-medium">Description</th>
                                              <th className="text-right px-4 py-2.5 font-medium">Qty</th>
                                              <th className="text-center px-4 py-2.5 font-medium">Unit</th>
                                              <th className="text-right px-4 py-2.5 font-medium">Unit Cost</th>
                                              <th className="text-right px-4 py-2.5 font-medium">Line Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {cat.lineItems.map((item, j) => {
                                              const qty = item.qtyFormula(sqftNum || 2000, bathsNum, bedsNum);
                                              const lineLow = adj(qty * item.unitCostLow);
                                              const lineHigh = adj(qty * item.unitCostHigh);
                                              return (
                                                <tr key={j} className="border-t border-border/20 hover:bg-muted/30 transition-colors">
                                                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.costCode}</td>
                                                  <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                                                  <td className="px-4 py-2.5 text-right font-medium text-foreground">{qty.toLocaleString()}</td>
                                                  <td className="px-4 py-2.5 text-center text-muted-foreground">{item.unit}</td>
                                              <td className="px-4 py-2.5 text-right text-muted-foreground">${adj(item.unitCostLow)}–${adj(item.unitCostHigh)}</td>
                                                  <td className="px-4 py-2.5 text-right font-semibold text-foreground">${lineLow.toLocaleString()}–${lineHigh.toLocaleString()}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot>
                                            <tr className="border-t-2 border-border bg-muted/40">
                                              <td colSpan={5} className="px-4 py-3 font-semibold text-foreground text-right">Category Total</td>
                                              <td className="px-4 py-3 font-bold text-foreground text-right">${totals.low.toLocaleString()}–${totals.high.toLocaleString()}</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                    Click a card to add it to your scope • Expand to see the detailed line-item takeoff
                  </p>

                  {/* Contingency line */}
                  {selectedScopes.length > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">10% Contingency Buffer</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">+ ${contingencyLow.toLocaleString()} – ${contingencyHigh.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Disclaimers */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">10% Contingency Included</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          All totals include a <strong>10% contingency buffer</strong> for unforeseen extras that commonly arise during renovation — including hidden damage, code upgrades, material price changes, and scope adjustments. This is industry best practice and strongly recommended for any renovation project.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      <Layers className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Structural & Layout Changes May Increase Cost</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          If your renovation involves <strong>removing or relocating walls, adding beams or headers, relocating plumbing stacks, or modifying structural elements</strong>, costs can increase significantly. Structural engineering ($2,000–$5,000+), steel beams ($3,000–$10,000+), and associated permits are not fully captured in standard line items. A site assessment is strongly recommended.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Contractor-Grade Materials & Standard Installation</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          All estimates are based on <strong>contractor-grade (mid-range) materials</strong> and <strong>standard installation methods</strong>. Custom cabinetry, designer fixtures, high-end stone, imported tile, or luxury finishes will increase costs significantly — often 40–100%+ above these figures.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">General Contractor Pricing Included</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          These estimates include a <strong>25% general contractor markup</strong> for project management, coordination, insurance, and overhead. This reflects the true cost of hiring a licensed GC — not just subcontractor rates.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Important Disclaimer</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          These are <strong>preliminary estimates only</strong> and should not be construed as a bid, proposal, or contract. Actual costs depend on site conditions, structural requirements, permit fees, material selections, and contractor availability. Unforeseen conditions (asbestos, mold, structural deficiencies) may increase costs. SmartReno is a technology platform connecting homeowners with independent contractors and does not perform construction services.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Scope Builder Summary ── */}
              <AnimatePresence>
                {selectedScopes.length > 0 && (
                  <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-border/50 bg-foreground">
                    <div className="mx-auto max-w-6xl px-6 py-10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                          <p className="text-sm text-background/60 mb-1">{selectedScopes.length} scope{selectedScopes.length > 1 ? "s" : ""} selected • {selectedCats.reduce((n, c) => n + c.lineItems.length, 0)} line items</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold text-background">${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</span>
                            <span className="text-sm text-background/50">preliminary estimate</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedCats.map(c => (
                              <span key={c.id} className="inline-flex items-center gap-1.5 text-xs bg-background/10 text-background/80 px-2.5 py-1 rounded-full">
                                {c.label}
                                <button onClick={(e) => { e.stopPropagation(); toggleScope(c.id); }}><X className="h-3 w-3 hover:text-background" /></button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8 py-6 h-auto rounded-xl">
                            <Link to="/homeowner/intake">
                              <Phone className="mr-2 h-4 w-4" /> Schedule Free Consultation
                            </Link>
                          </Button>
                          <Button asChild size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 text-base px-6 py-6 h-auto rounded-xl">
                            <Link to="/start-your-renovation">Start Your Project</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* ── Methodology ── */}
              <section className="border-t border-border/50">
                <div className="mx-auto max-w-4xl px-6 py-10">
                  <div className="flex gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                    <div className="shrink-0 h-10 w-10 rounded-full bg-muted grid place-items-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">How We Calculate These Estimates</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Quantities are derived from your property's square footage, number of bathrooms, and bedroom count using industry-standard cost codes (CSI MasterFormat). Unit costs reflect current Northern NJ contractor-grade material and labor rates with a <strong>25% GC markup</strong> included. Regional multipliers adjust for local market conditions in <strong>{property.town}</strong>. Custom or luxury finishes, unforeseen conditions, and specialty trades may increase these figures. A SmartReno estimator will provide exact pricing after an on-site walkthrough.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Full-width CTA ── */}
              <section className="border-t border-border/50 bg-foreground">
                <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-medium text-background/70 mb-6">
                    <Phone className="h-3.5 w-3.5" /> Free Consultation
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-background mb-4">
                    Get an Exact Renovation Price
                  </h2>
                  <p className="text-background/60 mb-4 max-w-lg mx-auto leading-relaxed">
                    These estimates are a starting point. Schedule a free 30-minute consultation with a SmartReno estimator who will walk your property, review the scope, and deliver a detailed proposal — no strings attached.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-background/50 text-sm">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Licensed Estimators</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No Obligation</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Vetted Contractors</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-8 py-6 h-auto rounded-xl">
                      <Link to="/homeowner/intake">
                        <Phone className="mr-2 h-5 w-5" /> Schedule Free Consultation
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 text-base px-8 py-6 h-auto rounded-xl">
                      <Link to="/start-your-renovation">
                        Start Your Renovation <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
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
