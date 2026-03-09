import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { Star, MapPin, Shield, Award, Search, CheckCircle2, FileText, Hammer, ArrowRight, Users, Clock, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

function ContractorCard({ contractor, index, onRequestBid }: { contractor: typeof MOCK_CONTRACTORS[0]; index: number; onRequestBid: () => void }) {
  const initials = contractor.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-accent/40 transition-all duration-300"
    >
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
          <Button
            size="sm"
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
            onClick={onRequestBid}
          >
            <FileText className="h-4 w-4 mr-1" /> Request to Bid
          </Button>
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link to={`/contractors/${contractor.id}`}>View Profile</Link>
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
  const [showBidDialog, setShowBidDialog] = useState(false);
  const navigate = useNavigate();

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
        <meta name="description" content="Browse vetted, licensed contractors in Northern New Jersey. Get your project scoped and receive 3 qualified bids through SmartReno." />
        <link rel="canonical" href="https://smartreno.io/contractors" />
      </Helmet>

      <SiteNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold tracking-widest uppercase text-white/70 mb-3"
          >
            The First Step Before You Renovate
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight"
          >
            Vetted Contractors, Qualified Bids
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
          >
            SmartReno protects your time, money and home. We scope your project, then vetted contractors provide accurate pricing — you receive 3 qualified bids.
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 flex flex-wrap justify-center gap-6 text-white/70 text-sm"
          >
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> Vetted & Verified</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Licensed & Insured</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 3 Bids Per Project</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Free Scoping Visit</span>
          </motion.div>

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

      {/* How It Works Banner */}
      <section className="bg-muted/50 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { step: "1", title: "Start Your Project", desc: "Fill out the form and a construction agent schedules a site visit" },
              { step: "2", title: "We Scope the Work", desc: "Our team creates a detailed scope of work for your renovation" },
              { step: "3", title: "Get 3 Qualified Bids", desc: "Vetted contractors provide competitive, accurate pricing" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
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
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              index={i}
              onRequestBid={() => setShowBidDialog(true)}
            />
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

      {/* CTA - Start Your Project */}
      <section className="bg-primary py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Ready to Get Started?</h2>
          <p className="mt-3 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            SmartReno protects your time, money and home. Start your project and receive 3 qualified bids from vetted contractors.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-background text-foreground hover:bg-background/90 px-10 py-4 text-lg font-bold rounded-xl shadow-md"
            onClick={() => navigate("/start-your-renovation")}
          >
            <Hammer className="mr-2 h-5 w-5" /> Start Your Project
          </Button>
        </div>
      </section>

      {/* Contractor CTA */}
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

      <FooterAdminLogin />

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project First</DialogTitle>
            <DialogDescription className="text-center">
              To request bids from vetted contractors, start by telling us about your project. A SmartReno construction agent will come to your home, scope the work, and you'll receive 3 qualified bids.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                SmartReno protects your time, money and home
              </p>
              <p className="text-xs text-muted-foreground italic">The first step before you renovate.</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setShowBidDialog(false);
                navigate("/start-your-renovation");
              }}
            >
              Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => {
                  setShowBidDialog(false);
                  navigate("/login");
                }}
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
