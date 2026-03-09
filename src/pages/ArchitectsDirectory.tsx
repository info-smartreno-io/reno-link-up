import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SmartRenoProcessSteps } from "@/components/marketing/SmartRenoProcessSteps";
import { Star, MapPin, Shield, Award, Search, CheckCircle2, FileText, Hammer, ArrowRight, Users, Clock, BadgeCheck, Building2 } from "lucide-react";
import watermarkArchitect from "@/assets/watermark-architect.png";
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
    id: "a1", name: "Jordan Rosenberg Architects & Associates", specialty: "Residential Architecture",
    rating: 4.9, reviews: 34, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 30,
    specialties: ["Custom Homes", "Additions", "Luxury Residential"],
    completedProjects: 380,
    website: "https://jrarchitect.com",
    phone: "(201) 669-8614",
    description: "High-end residential firm specializing in custom homes, additions, and luxury townhouses across NY, NJ & CT. Known for exceptional client collaboration and aesthetic excellence.",
  },
  {
    id: "a2", name: "LVA Architects", specialty: "Residential Architecture",
    rating: 4.8, reviews: 21, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 15,
    specialties: ["Modern Design", "Urbanism", "Landscape"],
    completedProjects: 145,
    website: "https://www.lva-a.com",
    phone: "(917) 810-6074",
    description: "Architecture/Urbanism/Landscape firm at 80 N Irving St, Ridgewood. Focused on conceptual design talent and producing high-quality residential and urban design packages.",
  },
  {
    id: "a3", name: "Plan Architecture", specialty: "Luxury Residential Architecture",
    rating: 5.0, reviews: 42, location: "Washington Twp, NJ", zip: "07676",
    verified: true, licensed: true, insured: true, yearsExp: 12,
    specialties: ["Luxury Custom Homes", "Commercial", "Interior Architecture"],
    completedProjects: 190,
    website: "https://www.plnarc.com",
    phone: "(201) 664-0444",
    description: "Award-winning, client-forward firm founded by Dan D'Agostino, AIA. Frequently hailed as a 'hidden gem' by celebrity and creative-industry clientele. Full-service architecture in Bergen County.",
  },
  {
    id: "a4", name: "Paredes-Grube Architecture", specialty: "Residential Architecture",
    rating: 4.8, reviews: 18, location: "Glen Rock, NJ", zip: "07452",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Residential", "Renovations", "Additions"],
    completedProjects: 210,
    website: "https://p-garchitecture.com",
    phone: "(201) 857-0020",
    description: "Glen Rock-based residential architecture firm with deep Bergen County expertise. Known for the Pembroke Place Residence and thoughtful home transformations.",
  },
  {
    id: "a5", name: "Nick Tsapatsaris & Associates", specialty: "Residential & Structural Architecture",
    rating: 4.9, reviews: 27, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 35,
    specialties: ["Architecture", "Structural Engineering", "Civil Engineering"],
    completedProjects: 450,
    website: "https://www.nicktsapatsaris.com",
    phone: "(201) 652-4800",
    description: "Founded in 1990, licensed in Architecture, Structural & Civil Engineering. Also owns Lakos Construction for integrated design-build. AIA-NJ member serving as guardians of quality of life.",
  },
  {
    id: "a6", name: "Terracotta Studio", specialty: "Residential Architecture & Interior Design",
    rating: 4.7, reviews: 15, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 14,
    specialties: ["Residential", "Interior Design", "Unified Home Design"],
    completedProjects: 130,
    website: "https://terracottast.com",
    phone: "(201) 444-8900",
    description: "Residential Architecture & Interior Design firm delivering a unified vision for your home. Combines architectural and interior expertise for cohesive results.",
  },
  {
    id: "a7", name: "Zampolin & Associates Architects", specialty: "Luxury Residential Architecture",
    rating: 4.9, reviews: 31, location: "Westwood, NJ", zip: "07675",
    verified: true, licensed: true, insured: true, yearsExp: 40,
    specialties: ["Luxury Homes", "Custom Residential", "Estates"],
    completedProjects: 520,
    website: "https://www.zampolin.com",
    phone: "(201) 664-7711",
    description: "Tri-State Premier Architecture Firm with over 40 years of experience. AIA-NJ member known for 'Design. Passion. Elegance.' Specializing in luxury residential.",
  },
  {
    id: "a8", name: "Arcari + Iovino Architects", specialty: "Commercial & Institutional Architecture",
    rating: 4.7, reviews: 14, location: "Little Ferry, NJ", zip: "07643",
    verified: true, licensed: true, insured: true, yearsExp: 18,
    specialties: ["Commercial", "Government", "Institutional"],
    completedProjects: 280,
    website: "https://www.aiarchs.com",
    phone: "(201) 641-1800",
    description: "Full-service firm with 11–50 employees specializing in government, commercial, and institutional projects. Senior Partner Joe Frangiosa leads a diverse project portfolio.",
  },
  {
    id: "a9", name: "FORS Architecture + Interiors", specialty: "Residential Architecture",
    rating: 4.6, reviews: 10, location: "Tucson, AZ (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 15,
    specialties: ["Residential", "Interiors", "Landscape Design"],
    completedProjects: 120,
    website: "https://www.forsarchitecture.com",
    phone: "(520) 555-0100",
    description: "AIA, IIDA, and APLD member firm offering architecture and interiors. Collaborative approach to residential design with landscape integration expertise.",
  },
  {
    id: "a10", name: "MVMK Architecture (Minervini Vandermark)", specialty: "Mixed Use & Residential Architecture",
    rating: 4.8, reviews: 16, location: "Hoboken, NJ", zip: "07030",
    verified: true, licensed: true, insured: true, yearsExp: 22,
    specialties: ["Mixed Use", "Multi-Family", "Commercial Interiors"],
    completedProjects: 240,
    website: "https://www.mvmkarchitecture.com",
    phone: "(201) 222-0808",
    description: "NJ-based firm whose work ranges from large high-profile residential and mixed-use projects to detailed interior commercial renovations. Serving NY, NJ and the Tri-State area.",
  },
  {
    id: "a11", name: "Spiezle Architectural Group", specialty: "Institutional & Healthcare Architecture",
    rating: 4.9, reviews: 38, location: "Hamilton, NJ", zip: "08619",
    verified: true, licensed: true, insured: true, yearsExp: 71,
    specialties: ["Education", "Healthcare", "Senior Living", "Government"],
    completedProjects: 800,
    website: "https://www.spiezle.com",
    phone: "(609) 586-5143",
    description: "100% Employee-Owned, nationally-recognized firm founded in 1954. 86+ employees, $4.6M annual revenue. Specializes in K-12, higher education, healthcare, and civic projects.",
  },
  {
    id: "a12", name: "BAAO / Barker Freeman Design Office", specialty: "Residential & Cultural Architecture",
    rating: 4.9, reviews: 22, location: "Brooklyn, NY (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 18,
    specialties: ["Residential", "Cultural", "Community Outreach"],
    completedProjects: 165,
    website: "https://www.baaostudio.com",
    phone: "(718) 797-0300",
    description: "Award-winning architecture bringing inventive design to residential, interior, cultural and commercial projects. Known for Deerfield House and Boerum Hill Townhouse.",
  },
  {
    id: "a13", name: "Gallin Beeler Design Studio", specialty: "Residential Architecture",
    rating: 4.8, reviews: 19, location: "Pleasantville, NY (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Modern", "Transitional", "Custom Homes"],
    completedProjects: 195,
    website: "https://gallinbeeler.com",
    phone: "(914) 769-2100",
    description: "Creative design studio delivering modern and transitional residential architecture. Listed on Houzz with projects throughout the NY/NJ metro area.",
  },
  {
    id: "a14", name: "Scott F. Lurie, Architect", specialty: "Residential Architecture",
    rating: 4.7, reviews: 11, location: "Oradell, NJ", zip: "07649",
    verified: true, licensed: true, insured: true, yearsExp: 25,
    specialties: ["Residential", "Additions", "Renovations"],
    completedProjects: 220,
    website: "https://www.houzz.com/professionals/architects-and-building-designers/scott-f-lurie-architect-pfvwus-pf~849320242",
    phone: "(201) 261-4400",
    description: "Oradell-based residential architect with 25 years of experience designing additions, renovations, and custom homes throughout Bergen County.",
  },
  {
    id: "a15", name: "Stonewater Architecture", specialty: "Custom Residential Architecture",
    rating: 4.9, reviews: 28, location: "New York Metro (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Custom New Construction", "Complete Renovations", "Commercial"],
    completedProjects: 250,
    website: "https://stonewaterarchitecture.com",
    phone: "(201) 555-0200",
    description: "Award-winning full-service architecture firm specializing in high-end custom new construction homes and complete home renovations. Also designs commercial, institutional, and government buildings.",
  },
  {
    id: "a16", name: "LAN Associates", specialty: "Multi-Discipline Architecture & Engineering",
    rating: 4.7, reviews: 13, location: "Midland Park, NJ", zip: "07432",
    verified: true, licensed: true, insured: true, yearsExp: 60,
    specialties: ["Municipal", "Education", "Commercial", "Residential"],
    completedProjects: 600,
    website: "https://www.lanassociates.com",
    phone: "(201) 447-6400",
    description: "Founded in 1965 with 51–200 employees. Multi-discipline architecture, engineering, and environmental services firm serving Bergen County and beyond.",
  },
  {
    id: "a17", name: "Courtney Lowry Architect LLC", specialty: "Residential Architecture",
    rating: 4.8, reviews: 12, location: "Central NJ (serving Bergen)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Residential", "Sustainable Design", "Renovations"],
    completedProjects: 175,
    website: "https://courtneylowryarchitect.com",
    phone: "(732) 555-0300",
    description: "AIA member and NCARB Certified architect with 20+ years of experience. Committed to sustainable design practices and thoughtful residential work.",
  },
  {
    id: "a18", name: "Appel Design Group Architects", specialty: "Residential & Commercial Architecture",
    rating: 4.6, reviews: 9, location: "Northern NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 25,
    specialties: ["Residential", "Commercial", "Interior Design"],
    completedProjects: 200,
    website: "https://adgarchitects.com",
    phone: "(973) 555-0400",
    description: "Architecture and planning firm with 9 employees specializing in residential and commercial projects across Northern New Jersey.",
  },
  {
    id: "a19", name: "Thomas Giegerich Architect LLC", specialty: "Residential Architecture",
    rating: 4.7, reviews: 14, location: "Fords, NJ (serving Bergen)", zip: "08863",
    verified: true, licensed: true, insured: true, yearsExp: 45,
    specialties: ["Additions", "Alterations", "Renovations", "Interiors"],
    completedProjects: 500,
    website: "https://thomasgiegericharchitect.com",
    phone: "(732) 738-1234",
    description: "45+ years of total experience primarily in residential work including additions, alterations, renovations & interiors. Founded in 2007 with deep NJ expertise.",
  },
  {
    id: "a20", name: "Adriana Segura, RA (LAN Associates)", specialty: "Architecture & Sustainability",
    rating: 4.8, reviews: 10, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 24,
    specialties: ["LEED Design", "Sustainable Architecture", "Commercial"],
    completedProjects: 180,
    website: "https://www.lanassociates.com",
    phone: "(201) 447-6400",
    description: "RA NJ/NY, AIA, LEED AP BD+C, NCARB certified Senior Designer at LAN Associates in Ridgewood. 24 years of experience in sustainable architecture and commercial design.",
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

        {/* Location & Contact */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{architect.location}</span>
          </div>
          {architect.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="ml-5.5">{architect.phone}</span>
            </div>
          )}
          {architect.website && (
            <a href={architect.website} target="_blank" rel="noopener noreferrer" className="ml-5.5 text-sm text-primary hover:underline truncate">
              {architect.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
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
        <img src={watermarkArchitect} alt="" className="absolute right-0 top-0 w-[900px] opacity-[0.08] pointer-events-none mix-blend-soft-light" />
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

      {/* How SmartReno Works */}
      <SmartRenoProcessSteps />

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
