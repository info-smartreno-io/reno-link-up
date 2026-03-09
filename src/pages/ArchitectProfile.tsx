import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, MapPin, Shield, Award, CheckCircle2, Phone, Globe,
  ArrowLeft, Clock, BadgeCheck, Building2, Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


const ARCHITECTS: Record<string, {
  id: string; name: string; specialty: string; rating: number; reviews: number;
  location: string; zip: string; verified: boolean; licensed: boolean; insured: boolean;
  yearsExp: number; specialties: string[]; completedProjects: number;
  website: string; phone: string; description: string;
}> = {
  a1: {
    id: "a1", name: "Jordan Rosenberg Architects & Associates", specialty: "Residential Architecture",
    rating: 4.9, reviews: 34, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 30,
    specialties: ["Custom Homes", "Additions", "Luxury Residential"],
    completedProjects: 380, website: "https://jrarchitect.com", phone: "(201) 669-8614",
    description: "High-end residential firm specializing in custom homes, additions, and luxury townhouses across NY, NJ & CT. Known for exceptional client collaboration and aesthetic excellence.",
  },
  a2: {
    id: "a2", name: "LVA Architects", specialty: "Residential Architecture",
    rating: 4.8, reviews: 21, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 15,
    specialties: ["Modern Design", "Urbanism", "Landscape"],
    completedProjects: 145, website: "https://www.lva-a.com", phone: "(917) 810-6074",
    description: "Architecture/Urbanism/Landscape firm at 80 N Irving St, Ridgewood. Focused on conceptual design talent and producing high-quality residential and urban design packages.",
  },
  a3: {
    id: "a3", name: "Plan Architecture", specialty: "Luxury Residential Architecture",
    rating: 5.0, reviews: 42, location: "Washington Twp, NJ", zip: "07676",
    verified: true, licensed: true, insured: true, yearsExp: 12,
    specialties: ["Luxury Custom Homes", "Commercial", "Interior Architecture"],
    completedProjects: 190, website: "https://www.plnarc.com", phone: "(201) 664-0444",
    description: "Award-winning, client-forward firm founded by Dan D'Agostino, AIA. Frequently hailed as a 'hidden gem' by celebrity and creative-industry clientele.",
  },
  a4: {
    id: "a4", name: "Paredes-Grube Architecture", specialty: "Residential Architecture",
    rating: 4.8, reviews: 18, location: "Glen Rock, NJ", zip: "07452",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Residential", "Renovations", "Additions"],
    completedProjects: 210, website: "https://p-garchitecture.com", phone: "(201) 857-0020",
    description: "Glen Rock-based residential architecture firm with deep Bergen County expertise. Known for the Pembroke Place Residence and thoughtful home transformations.",
  },
  a5: {
    id: "a5", name: "Nick Tsapatsaris & Associates", specialty: "Residential & Structural Architecture",
    rating: 4.9, reviews: 27, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 35,
    specialties: ["Architecture", "Structural Engineering", "Civil Engineering"],
    completedProjects: 450, website: "https://www.nicktsapatsaris.com", phone: "(201) 652-4800",
    description: "Founded in 1990, licensed in Architecture, Structural & Civil Engineering. Also owns Lakos Construction for integrated design-build.",
  },
  a6: {
    id: "a6", name: "Terracotta Studio", specialty: "Residential Architecture & Interior Design",
    rating: 4.7, reviews: 15, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 14,
    specialties: ["Residential", "Interior Design", "Unified Home Design"],
    completedProjects: 130, website: "https://terracottast.com", phone: "(201) 444-8900",
    description: "Residential Architecture & Interior Design firm delivering a unified vision for your home.",
  },
  a7: {
    id: "a7", name: "Zampolin & Associates Architects", specialty: "Luxury Residential Architecture",
    rating: 4.9, reviews: 31, location: "Westwood, NJ", zip: "07675",
    verified: true, licensed: true, insured: true, yearsExp: 40,
    specialties: ["Luxury Homes", "Custom Residential", "Estates"],
    completedProjects: 520, website: "https://www.zampolin.com", phone: "(201) 664-7711",
    description: "Tri-State Premier Architecture Firm with over 40 years of experience. AIA-NJ member known for 'Design. Passion. Elegance.'",
  },
  a8: {
    id: "a8", name: "Arcari + Iovino Architects", specialty: "Commercial & Institutional Architecture",
    rating: 4.7, reviews: 14, location: "Little Ferry, NJ", zip: "07643",
    verified: true, licensed: true, insured: true, yearsExp: 18,
    specialties: ["Commercial", "Government", "Institutional"],
    completedProjects: 280, website: "https://www.aiarchs.com", phone: "(201) 641-1800",
    description: "Full-service firm specializing in government, commercial, and institutional projects.",
  },
  a9: {
    id: "a9", name: "FORS Architecture + Interiors", specialty: "Residential Architecture",
    rating: 4.6, reviews: 10, location: "Tucson, AZ (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 15,
    specialties: ["Residential", "Interiors", "Landscape Design"],
    completedProjects: 120, website: "https://www.forsarchitecture.com", phone: "(520) 555-0100",
    description: "AIA, IIDA, and APLD member firm offering architecture and interiors with landscape integration.",
  },
  a10: {
    id: "a10", name: "MVMK Architecture (Minervini Vandermark)", specialty: "Mixed Use & Residential Architecture",
    rating: 4.8, reviews: 16, location: "Hoboken, NJ", zip: "07030",
    verified: true, licensed: true, insured: true, yearsExp: 22,
    specialties: ["Mixed Use", "Multi-Family", "Commercial Interiors"],
    completedProjects: 240, website: "https://www.mvmkarchitecture.com", phone: "(201) 222-0808",
    description: "NJ-based firm whose work ranges from large high-profile residential and mixed-use projects to detailed interior commercial renovations.",
  },
  a11: {
    id: "a11", name: "Spiezle Architectural Group", specialty: "Institutional & Healthcare Architecture",
    rating: 4.9, reviews: 38, location: "Hamilton, NJ", zip: "08619",
    verified: true, licensed: true, insured: true, yearsExp: 71,
    specialties: ["Education", "Healthcare", "Senior Living", "Government"],
    completedProjects: 800, website: "https://www.spiezle.com", phone: "(609) 586-5143",
    description: "100% Employee-Owned, nationally-recognized firm founded in 1954. 86+ employees specializing in K-12, healthcare, and civic projects.",
  },
  a12: {
    id: "a12", name: "BAAO / Barker Freeman Design Office", specialty: "Residential & Cultural Architecture",
    rating: 4.9, reviews: 22, location: "Brooklyn, NY (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 18,
    specialties: ["Residential", "Cultural", "Community Outreach"],
    completedProjects: 165, website: "https://www.baaostudio.com", phone: "(718) 797-0300",
    description: "Award-winning architecture bringing inventive design to residential, cultural and commercial projects.",
  },
  a13: {
    id: "a13", name: "Gallin Beeler Design Studio", specialty: "Residential Architecture",
    rating: 4.8, reviews: 19, location: "Pleasantville, NY (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Modern", "Transitional", "Custom Homes"],
    completedProjects: 195, website: "https://gallinbeeler.com", phone: "(914) 769-2100",
    description: "Creative design studio delivering modern and transitional residential architecture throughout the NY/NJ metro area.",
  },
  a14: {
    id: "a14", name: "Scott F. Lurie, Architect", specialty: "Residential Architecture",
    rating: 4.7, reviews: 11, location: "Oradell, NJ", zip: "07649",
    verified: true, licensed: true, insured: true, yearsExp: 25,
    specialties: ["Residential", "Additions", "Renovations"],
    completedProjects: 220, website: "https://www.houzz.com/professionals/architects-and-building-designers/scott-f-lurie-architect-pfvwus-pf~849320242", phone: "(201) 261-4400",
    description: "Oradell-based residential architect with 25 years designing additions, renovations, and custom homes throughout Bergen County.",
  },
  a15: {
    id: "a15", name: "Stonewater Architecture", specialty: "Custom Residential Architecture",
    rating: 4.9, reviews: 28, location: "New York Metro (serving NJ)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Custom New Construction", "Complete Renovations", "Commercial"],
    completedProjects: 250, website: "https://stonewaterarchitecture.com", phone: "(201) 555-0200",
    description: "Award-winning full-service architecture firm specializing in high-end custom new construction homes and complete home renovations.",
  },
  a16: {
    id: "a16", name: "LAN Associates", specialty: "Multi-Discipline Architecture & Engineering",
    rating: 4.7, reviews: 13, location: "Midland Park, NJ", zip: "07432",
    verified: true, licensed: true, insured: true, yearsExp: 60,
    specialties: ["Municipal", "Education", "Commercial", "Residential"],
    completedProjects: 600, website: "https://www.lanassociates.com", phone: "(201) 447-6400",
    description: "Founded in 1965 with 51–200 employees. Multi-discipline architecture, engineering, and environmental services firm.",
  },
  a17: {
    id: "a17", name: "Courtney Lowry Architect LLC", specialty: "Residential Architecture",
    rating: 4.8, reviews: 12, location: "Central NJ (serving Bergen)", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 20,
    specialties: ["Residential", "Sustainable Design", "Renovations"],
    completedProjects: 175, website: "https://courtneylowryarchitect.com", phone: "(732) 555-0300",
    description: "AIA member and NCARB Certified architect with 20+ years of experience committed to sustainable design.",
  },
  a18: {
    id: "a18", name: "Appel Design Group Architects", specialty: "Residential & Commercial Architecture",
    rating: 4.6, reviews: 9, location: "Northern NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 25,
    specialties: ["Residential", "Commercial", "Interior Design"],
    completedProjects: 200, website: "https://adgarchitects.com", phone: "(973) 555-0400",
    description: "Architecture and planning firm specializing in residential and commercial projects across Northern New Jersey.",
  },
  a19: {
    id: "a19", name: "Thomas Giegerich Architect LLC", specialty: "Residential Architecture",
    rating: 4.7, reviews: 14, location: "Fords, NJ (serving Bergen)", zip: "08863",
    verified: true, licensed: true, insured: true, yearsExp: 45,
    specialties: ["Additions", "Alterations", "Renovations", "Interiors"],
    completedProjects: 500, website: "https://thomasgiegericharchitect.com", phone: "(732) 738-1234",
    description: "45+ years of experience primarily in residential work including additions, alterations, renovations & interiors.",
  },
  a20: {
    id: "a20", name: "Adriana Segura, RA (LAN Associates)", specialty: "Architecture & Sustainability",
    rating: 4.8, reviews: 10, location: "Ridgewood, NJ", zip: "07450",
    verified: true, licensed: true, insured: true, yearsExp: 24,
    specialties: ["LEED Design", "Sustainable Architecture", "Commercial"],
    completedProjects: 180, website: "https://www.lanassociates.com", phone: "(201) 447-6400",
    description: "RA NJ/NY, AIA, LEED AP BD+C, NCARB certified Senior Designer. 24 years of experience in sustainable architecture.",
  },
};


export default function ArchitectProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const architect = ARCHITECTS[id];
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidForm, setBidForm] = useState({ name: "", email: "", phone: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleBidRequest = async () => {
    if (!bidForm.name || !bidForm.email) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("architect_bid_requests").insert({
        architect_name: architect?.name || "Unknown",
        architect_id: id,
        requester_name: bidForm.name,
        requester_email: bidForm.email,
        requester_phone: bidForm.phone || null,
        project_description: bidForm.description || null,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Request Submitted", description: "Our team will coordinate the bid process." });
      setShowBidDialog(false);
      setBidForm({ name: "", email: "", phone: "", description: "" });
    } catch {
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!architect) {
    return (
      <>
        <MarketingNavbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Architect Not Found</h1>
            <p className="text-muted-foreground">This architect profile doesn't exist.</p>
            <Button onClick={() => navigate("/architects")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
            </Button>
          </div>
        </main>
        <MarketingFooter />
      </>
    );
  }

  const initials = architect.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const displayUrl = architect.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <>
      <Helmet>
        <title>{architect.name} | SmartReno Architect Network</title>
        <meta name="description" content={`${architect.name} — ${architect.specialty} in ${architect.location}. ${architect.yearsExp} years experience, ${architect.completedProjects} projects completed.`} />
      </Helmet>

      <MarketingNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 mb-6" onClick={() => navigate("/architects")}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Directory
            </Button>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl shadow-lg border border-white/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{architect.name}</h1>
                  {architect.verified && (
                    <Badge className="bg-white/20 text-white border-white/30 gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-lg mt-1">{architect.specialty}</p>
                <div className="flex items-center gap-4 mt-3 text-white/70 text-sm flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {architect.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {architect.yearsExp} years</span>
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {architect.completedProjects} projects</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {architect.rating} ({architect.reviews} reviews)
                  </span>
                </div>
                <div className="flex gap-3 mt-5 flex-wrap">
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => setShowBidDialog(true)}>
                    Request to Bid
                  </Button>
                  <a href={`tel:${architect.phone}`}>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Phone className="mr-2 h-4 w-4" /> Call
                    </Button>
                  </a>
                  <a href={architect.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Globe className="mr-2 h-4 w-4" /> Website
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{architect.description}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {architect.specialties.map(s => (
                      <Badge key={s} variant="secondary" className="text-sm">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Portfolio</h2>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      This architect hasn't added portfolio items yet. Check back soon or visit their website for project examples.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-foreground">Contact</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" /> {architect.phone}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 text-primary" />
                      <a href={architect.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{displayUrl}</a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> {architect.location} {architect.zip}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-foreground">Credentials</h3>
                  <div className="space-y-2 text-sm">
                    {architect.licensed && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BadgeCheck className="h-4 w-4 text-accent" /> NJ Licensed Architect
                      </div>
                    )}
                    {architect.insured && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4 text-accent" /> Fully Insured
                      </div>
                    )}
                    {architect.verified && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent" /> SmartReno Verified
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-3">At a Glance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{architect.yearsExp}</p>
                      <p className="text-xs text-muted-foreground">Years Exp.</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{architect.completedProjects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{architect.rating}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{architect.reviews}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" size="lg" onClick={() => setShowBidDialog(true)}>
                Request to Bid
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />

      {/* Bid Request Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request {architect.name} to Bid</DialogTitle>
            <DialogDescription>Submit your details and our team will coordinate the bidding process.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="bid-name">Your Name *</Label>
              <Input id="bid-name" value={bidForm.name} onChange={e => setBidForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="bid-email">Email *</Label>
              <Input id="bid-email" type="email" value={bidForm.email} onChange={e => setBidForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="bid-phone">Phone</Label>
              <Input id="bid-phone" value={bidForm.phone} onChange={e => setBidForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="bid-desc">Project Description</Label>
              <Textarea id="bid-desc" value={bidForm.description} onChange={e => setBidForm(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" />
            </div>
            <Button className="w-full" onClick={handleBidRequest} disabled={submitting || !bidForm.name || !bidForm.email}>
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
