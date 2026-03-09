import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Star, MapPin, Shield, Award, Search, CheckCircle2, FileText, Hammer, ArrowRight, Users, Clock, BadgeCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SPECIALTIES = [
  { value: "", label: "All Specialties" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "historic", label: "Historic Preservation" },
  { value: "sustainable", label: "Sustainable / Green" },
  { value: "additions", label: "Additions & Extensions" },
  { value: "new-construction", label: "New Construction" },
  { value: "interior", label: "Interior Architecture" },
];

const MOCK_ARCHITECTS = [
  {
    id: "a1", name: "Peter Eisenman Architects", specialty: "Residential Architecture",
    rating: 4.9, reviews: 28, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 40,
    specialties: ["Residential", "Modern Design", "Custom Homes"], completedProjects: 350,
    description: "Award-winning firm specializing in innovative residential design in Bergen County.",
  },
  {
    id: "a2", name: "Fores Architecture + Interiors", specialty: "Residential Architecture",
    rating: 4.8, reviews: 19, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 22,
    specialties: ["Residential", "Interiors", "Renovations"], completedProjects: 210,
    description: "Full-service architecture and interior design firm serving Northern NJ.",
  },
  {
    id: "a3", name: "Studioberg Architecture", specialty: "Residential Architecture",
    rating: 4.9, reviews: 15, location: "Glen Rock, NJ", zip: "07452",
    verified: true, licensed: true, insured: true, yearsExp: 18,
    specialties: ["Modern Homes", "Additions", "Green Design"], completedProjects: 175,
    description: "Boutique architecture studio focused on sustainable modern homes.",
  },
  {
    id: "a4", name: "Nicholas Stathis Architect", specialty: "Residential Architecture",
    rating: 4.7, reviews: 12, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 25,
    specialties: ["Custom Homes", "Historic Renovation", "Additions"], completedProjects: 280,
    description: "Experienced architect specializing in custom homes and historic renovations.",
  },
  {
    id: "a5", name: "Robert Zampolin Architect", specialty: "Residential Architecture",
    rating: 4.8, reviews: 22, location: "Wyckoff, NJ", zip: "07481",
    verified: true, licensed: true, insured: true, yearsExp: 30,
    specialties: ["Residential", "Luxury Homes", "Additions"], completedProjects: 320,
    description: "Premier residential architect in Bergen County with 30 years of experience.",
  },
  {
    id: "a6", name: "Gallin Beeler Design Studio", specialty: "Residential Architecture",
    rating: 4.9, reviews: 31, location: "Ho-Ho-Kus, NJ", zip: "07423",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Modern", "Transitional", "Custom Homes"], completedProjects: 195,
    description: "Creative design studio delivering modern and transitional residential architecture.",
  },
  {
    id: "a7", name: "RSVP Architecture Studio", specialty: "Residential Architecture",
    rating: 4.6, reviews: 9, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 15,
    specialties: ["Renovations", "Additions", "Interior Architecture"], completedProjects: 140,
    description: "Focused on thoughtful renovations and additions for suburban homes.",
  },
  {
    id: "a8", name: "Thomas Juul-Hansen Architect", specialty: "Residential Architecture",
    rating: 4.8, reviews: 26, location: "Paramus, NJ", zip: "07652",
    verified: true, licensed: true, insured: true, yearsExp: 28,
    specialties: ["Luxury Residential", "New Construction", "Modern"], completedProjects: 245,
    description: "High-end residential architect known for sleek modern designs.",
  },
  {
    id: "a9", name: "Dubbeldam Architecture + Design", specialty: "Residential Architecture",
    rating: 4.7, reviews: 14, location: "Fair Lawn, NJ", zip: "07410",
    verified: true, licensed: true, insured: true, yearsExp: 19,
    specialties: ["Sustainable Design", "Renovations", "Residential"], completedProjects: 160,
    description: "Sustainable architecture firm specializing in eco-friendly residential projects.",
  },
  {
    id: "a10", name: "Miller Architecture LLC", specialty: "Residential Architecture",
    rating: 4.8, reviews: 17, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 23,
    specialties: ["Custom Homes", "Additions", "Historic Preservation"], completedProjects: 230,
    description: "Trusted local firm specializing in custom homes and historic preservation.",
  },
  {
    id: "a11", name: "Scarola Architecture", specialty: "Residential Architecture",
    rating: 4.9, reviews: 20, location: "Oradell, NJ", zip: "07649",
    verified: true, licensed: true, insured: true, yearsExp: 32,
    specialties: ["Luxury Homes", "Estates", "New Construction"], completedProjects: 400,
    description: "Luxury estate architect with decades of experience in Bergen County.",
  },
  {
    id: "a12", name: "Arcari + Iovino Architects", specialty: "Commercial Architecture",
    rating: 4.7, reviews: 11, location: "Hackensack, NJ", zip: "07601",
    verified: true, licensed: true, insured: true, yearsExp: 35,
    specialties: ["Commercial", "Mixed Use", "Institutional"], completedProjects: 310,
    description: "Full-service firm with expertise in commercial and institutional design.",
  },
  {
    id: "a13", name: "Koenig Architecture LLC", specialty: "Residential Architecture",
    rating: 4.8, reviews: 13, location: "Saddle River, NJ", zip: "07458",
    verified: true, licensed: true, insured: true, yearsExp: 21,
    specialties: ["Luxury Custom Homes", "Additions", "Modern"], completedProjects: 185,
    description: "Boutique firm delivering luxury custom homes in upper Bergen County.",
  },
  {
    id: "a14", name: "Minervini Vandermark Architecture", specialty: "Residential Architecture",
    rating: 4.6, reviews: 8, location: "Ramsey, NJ", zip: "07446",
    verified: true, licensed: true, insured: true, yearsExp: 27,
    specialties: ["Residential", "Renovations", "Commercial"], completedProjects: 260,
    description: "Versatile firm handling residential renovations and commercial projects.",
  },
  {
    id: "a15", name: "Spiezle Architectural Group", specialty: "Commercial Architecture",
    rating: 4.9, reviews: 35, location: "Paramus, NJ", zip: "07652",
    verified: true, licensed: true, insured: true, yearsExp: 40,
    specialties: ["Education", "Healthcare", "Civic"], completedProjects: 500,
    description: "Large-scale firm specializing in education, healthcare, and civic projects.",
  },
  {
    id: "a16", name: "Remington Architecture", specialty: "Residential Architecture",
    rating: 4.7, reviews: 10, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 16,
    specialties: ["Residential", "Kitchens", "Additions"], completedProjects: 145,
    description: "Local Ridgewood firm focused on residential renovations and additions.",
  },
  {
    id: "a17", name: "Orr Architecture + Design", specialty: "Residential Architecture",
    rating: 4.8, reviews: 18, location: "Allendale, NJ", zip: "07401",
    verified: true, licensed: true, insured: true, yearsExp: 24,
    specialties: ["Custom Homes", "Sustainable", "Modern"], completedProjects: 215,
    description: "Award-winning sustainable architecture practice in Northern NJ.",
  },
  {
    id: "a18", name: "CMG Architects", specialty: "Residential Architecture",
    rating: 4.6, reviews: 7, location: "Waldwick, NJ", zip: "07463",
    verified: true, licensed: true, insured: true, yearsExp: 14,
    specialties: ["Residential", "Renovations", "Permit Design"], completedProjects: 120,
    description: "Efficient residential architect specializing in permit-ready designs.",
  },
  {
    id: "a19", name: "Barker Freeman Design Office", specialty: "Residential Architecture",
    rating: 4.9, reviews: 24, location: "Glen Rock, NJ", zip: "07452",
    verified: true, licensed: true, insured: true, yearsExp: 17,
    specialties: ["Modern", "Renovation", "Interiors"], completedProjects: 170,
    description: "Design-forward office known for modern residential renovations.",
  },
  {
    id: "a20", name: "Thalheimer Architecture", specialty: "Residential Architecture",
    rating: 4.7, reviews: 16, location: "Mahwah, NJ", zip: "07430",
    verified: true, licensed: true, insured: true, yearsExp: 29,
    specialties: ["Custom Homes", "Estates", "Historic Restoration"], completedProjects: 290,
    description: "Experienced architect specializing in estates and historic restoration.",
  },
];

function ArchitectCard({ architect, index, onRequestBid }: { architect: typeof MOCK_ARCHITECTS[0]; index: number; onRequestBid: () => void }) {
  const initials = architect.name.split(" ").map(w => w[0]).join("").slice(0, 2);

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
          <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground truncate">{architect.name}</h3>
              {architect.verified && (
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{architect.specialty}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{architect.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-pending text-pending" />
            <span className="font-semibold text-card-foreground">{architect.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({architect.reviews} reviews)</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{architect.completedProjects} projects</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{architect.location}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {architect.licensed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
              <Shield className="h-3 w-3" /> Licensed
            </span>
          )}
          {architect.insured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-muted px-2.5 py-1 text-xs font-medium text-info">
              <Shield className="h-3 w-3" /> Insured
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <Award className="h-3 w-3" /> {architect.yearsExp} yrs exp.
          </span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5">
          {architect.specialties.map((s) => (
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
            <Link to={`/architects/${architect.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ArchitectsDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [selectedArchitect, setSelectedArchitect] = useState<typeof MOCK_ARCHITECTS[0] | null>(null);
  const [bidForm, setBidForm] = useState({ name: "", email: "", phone: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredArchitects = MOCK_ARCHITECTS.filter((a) => {
    if (specialty && !a.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))) return false;
    if (zip && !a.zip.startsWith(zip)) return false;
    return true;
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (zip) params.set("zip", zip);
    setSearchParams(params);
  };

  const handleRequestBid = (architect: typeof MOCK_ARCHITECTS[0]) => {
    setSelectedArchitect(architect);
    setShowBidDialog(true);
  };

  const handleSubmitBidRequest = async () => {
    if (!bidForm.name || !bidForm.email) {
      toast({ title: "Required fields", description: "Please enter your name and email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("architect_bid_requests").insert({
        architect_name: selectedArchitect?.name || "",
        architect_id: selectedArchitect?.id || "",
        requester_name: bidForm.name,
        requester_email: bidForm.email,
        requester_phone: bidForm.phone,
        project_description: bidForm.description,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Request Submitted!", description: "Our team will reach out to coordinate the bid process." });
      setShowBidDialog(false);
      setBidForm({ name: "", email: "", phone: "", description: "" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Find Architects in Northern NJ | SmartReno Directory</title>
        <meta name="description" content="Browse licensed architects in Northern New Jersey. Request bids from vetted architecture firms through SmartReno." />
        <link rel="canonical" href="https://smartreno.io/architects" />
      </Helmet>

      <MarketingNavbar />

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
            Design Your Dream Home
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight"
          >
            Licensed Architects, Trusted Results
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
          >
            Find vetted architecture firms in Northern NJ. Request a bid and our team coordinates the process.
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 flex flex-wrap justify-center gap-6 text-white/70 text-sm"
          >
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> AIA Licensed</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Fully Insured</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> 20+ Firms</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Fast Response</span>
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
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="flex-1 rounded-xl border-0 bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {SPECIALTIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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

      {/* How It Works */}
      <section className="bg-muted/50 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { step: "1", title: "Browse Architects", desc: "Explore licensed architecture firms serving Northern NJ" },
              { step: "2", title: "Request a Bid", desc: "Click 'Request to Bid' and submit your project details" },
              { step: "3", title: "We Coordinate", desc: "SmartReno connects you with the architect and manages the process" },
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
              {filteredArchitects.length} Architect{filteredArchitects.length !== 1 ? "s" : ""} Found
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Northern New Jersey • Licensed & Insured</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArchitects.map((architect, i) => (
            <ArchitectCard
              key={architect.id}
              architect={architect}
              index={i}
              onRequestBid={() => handleRequestBid(architect)}
            />
          ))}
        </div>

        {filteredArchitects.length === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">No architects found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search filters</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Ready to Design Your Project?</h2>
          <p className="mt-3 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            SmartReno connects you with licensed architects and manages the entire process from design to construction.
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

      {/* Architect CTA */}
      <section className="bg-muted py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Are You an Architect?</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Join our network to receive qualified project leads and grow your practice.
          </p>
          <Link to="/professionals/auth">
            <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-4 text-lg font-bold rounded-xl shadow-md">
              Join the SmartReno Network
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              Request Bid from {selectedArchitect?.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              Submit your details and our team will coordinate the bid process with this architect.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="bid-name">Your Name *</Label>
              <Input
                id="bid-name"
                value={bidForm.name}
                onChange={(e) => setBidForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid-email">Email *</Label>
              <Input
                id="bid-email"
                type="email"
                value={bidForm.email}
                onChange={(e) => setBidForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid-phone">Phone</Label>
              <Input
                id="bid-phone"
                value={bidForm.phone}
                onChange={(e) => setBidForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(201) 555-0123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid-desc">Project Description</Label>
              <Textarea
                id="bid-desc"
                value={bidForm.description}
                onChange={(e) => setBidForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your project (type, size, goals)..."
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmitBidRequest}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              SmartReno will review your request and coordinate with the architect.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
