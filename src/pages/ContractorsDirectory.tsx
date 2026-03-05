import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Star, MapPin, Shield, Award, Phone, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TRADES = [
  { value: "", label: "All Trades" },
  { value: "general", label: "General Contractor" },
  { value: "kitchen", label: "Kitchen Specialist" },
  { value: "bathroom", label: "Bathroom Specialist" },
  { value: "basement", label: "Basement Finishing" },
  { value: "addition", label: "Home Additions" },
  { value: "exterior", label: "Exterior / Roofing" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
];

const MOCK_CONTRACTORS = [
  {
    id: "1",
    name: "Apex Home Renovations",
    trade: "General Contractor",
    rating: 4.9,
    reviews: 127,
    location: "Ridgewood, NJ",
    zip: "07450",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 18,
    specialties: ["Kitchen", "Bathroom", "Additions"],
    avatar: null,
    completedProjects: 340,
  },
  {
    id: "2",
    name: "Bergen Kitchen & Bath",
    trade: "Kitchen Specialist",
    rating: 4.8,
    reviews: 89,
    location: "Glen Rock, NJ",
    zip: "07452",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 12,
    specialties: ["Kitchen", "Bathroom"],
    avatar: null,
    completedProjects: 215,
  },
  {
    id: "3",
    name: "NJ Basement Pros",
    trade: "Basement Finishing",
    rating: 4.7,
    reviews: 64,
    location: "Fair Lawn, NJ",
    zip: "07410",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 9,
    specialties: ["Basement", "Flooring"],
    avatar: null,
    completedProjects: 180,
  },
  {
    id: "4",
    name: "Summit Exterior Solutions",
    trade: "Exterior / Roofing",
    rating: 4.9,
    reviews: 102,
    location: "Wyckoff, NJ",
    zip: "07481",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 22,
    specialties: ["Roofing", "Siding", "Windows"],
    avatar: null,
    completedProjects: 520,
  },
  {
    id: "5",
    name: "Tri-County Electric",
    trade: "Electrical",
    rating: 4.6,
    reviews: 53,
    location: "Paramus, NJ",
    zip: "07652",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 15,
    specialties: ["Electrical", "Smart Home"],
    avatar: null,
    completedProjects: 290,
  },
  {
    id: "6",
    name: "Prestige Home Additions",
    trade: "Home Additions",
    rating: 4.8,
    reviews: 76,
    location: "Montclair, NJ",
    zip: "07042",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 20,
    specialties: ["Additions", "Second Story", "In-Law Suites"],
    avatar: null,
    completedProjects: 145,
  },
];

function ContractorCard({ contractor, index }: { contractor: typeof MOCK_CONTRACTORS[0]; index: number }) {
  const initials = contractor.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-accent/40 transition-all duration-300"
    >
      {/* Glossy shine overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-lg shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground truncate">{contractor.name}</h3>
              {contractor.verified && (
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{contractor.trade}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-pending text-pending" />
            <span className="font-semibold text-card-foreground">{contractor.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({contractor.reviews} reviews)</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{contractor.completedProjects} projects</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{contractor.location}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {contractor.licensed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
              <Shield className="h-3 w-3" /> Licensed
            </span>
          )}
          {contractor.insured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-muted px-2.5 py-1 text-xs font-medium text-info">
              <Shield className="h-3 w-3" /> Insured
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <Award className="h-3 w-3" /> {contractor.yearsExp} yrs exp.
          </span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5">
          {contractor.specialties.map((s) => (
            <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {s}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
            <Phone className="h-4 w-4 mr-1" /> Contact
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ContractorsDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trade, setTrade] = useState(searchParams.get("trade") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");

  const filteredContractors = MOCK_CONTRACTORS.filter((c) => {
    if (trade && !c.trade.toLowerCase().includes(trade.toLowerCase())) return false;
    if (zip && !c.zip.startsWith(zip)) return false;
    return true;
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (trade) params.set("trade", trade);
    if (zip) params.set("zip", zip);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Find Contractors in Northern NJ | SmartReno Directory</title>
        <meta name="description" content="Browse vetted, licensed contractors in Northern New Jersey. Read reviews, compare bids, and hire with confidence through SmartReno." />
        <link rel="canonical" href="https://smartreno.io/contractors" />
      </Helmet>

      <SiteNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary py-20 px-4">
        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight"
          >
            Find Trusted Contractors
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
          >
            Every contractor is vetted, licensed, and insured. Compare bids, read verified reviews, and hire with confidence.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 mx-auto max-w-2xl"
          >
            <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-2xl">
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="flex-1 rounded-xl border-0 bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {TRADES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP Code"
                maxLength={5}
                className="w-full sm:w-32 rounded-xl border-0 bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <Button
                onClick={handleSearch}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-sm font-bold shadow-md"
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {filteredContractors.length} Contractor{filteredContractors.length !== 1 ? "s" : ""} Found
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Northern New Jersey • Verified & Insured</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map((contractor, i) => (
            <ContractorCard key={contractor.id} contractor={contractor} index={i} />
          ))}
        </div>

        {filteredContractors.length === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">No contractors found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search filters</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-muted py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Are You a Contractor?</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Join our network to receive qualified leads and grow your business.
          </p>
          <Link to="/contractors/join">
            <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-4 text-lg font-bold rounded-xl shadow-md">
              Join the SmartReno Network
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
