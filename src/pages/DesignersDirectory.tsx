import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, CheckCircle2, Shield, Award,
  ArrowRight, Palette, PaintBucket, Ruler, Home, Users,
  Hammer, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const MOCK_DESIGNERS = [
  {
    id: "1", name: "Studio Ren Design", specialty: "Kitchen & Bath Design", rating: 4.9, reviews: 84,
    location: "Ridgewood, NJ", yearsExp: 14, verified: true,
    specialties: ["Kitchen", "Bathroom", "Open Concept"],
  },
  {
    id: "2", name: "NorthStar Interiors", specialty: "Full Home Design", rating: 4.8, reviews: 62,
    location: "Montclair, NJ", yearsExp: 11, verified: true,
    specialties: ["Whole Home", "Color Consultation", "Space Planning"],
  },
  {
    id: "3", name: "Blueprint Living", specialty: "Renovation Planning", rating: 4.7, reviews: 47,
    location: "Glen Rock, NJ", yearsExp: 8, verified: true,
    specialties: ["Renovations", "Layout Design", "Material Selection"],
  },
  {
    id: "4", name: "Elevated Spaces", specialty: "Luxury Residential", rating: 4.9, reviews: 93,
    location: "Short Hills, NJ", yearsExp: 19, verified: true,
    specialties: ["Luxury", "Custom Homes", "Additions"],
  },
  {
    id: "5", name: "Form & Function Design", specialty: "Modern Minimalist", rating: 4.6, reviews: 38,
    location: "Hoboken, NJ", yearsExp: 6, verified: true,
    specialties: ["Modern", "Minimalist", "Small Spaces"],
  },
  {
    id: "6", name: "Heritage Home Design", specialty: "Traditional & Classic", rating: 4.8, reviews: 71,
    location: "Morristown, NJ", yearsExp: 16, verified: true,
    specialties: ["Traditional", "Colonial", "Historic Homes"],
  },
];

function DesignerCard({ designer, index, onRequestBid }: { designer: typeof MOCK_DESIGNERS[0]; index: number; onRequestBid: () => void }) {
  const initials = designer.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground truncate">{designer.name}</h3>
              {designer.verified && <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">{designer.specialty}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-pending text-pending" />
            <span className="font-semibold text-card-foreground">{designer.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({designer.reviews} reviews)</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{designer.location}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
            <Shield className="h-3 w-3" /> Verified
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <Award className="h-3 w-3" /> {designer.yearsExp} yrs exp.
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {designer.specialties.map((s) => (
            <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{s}</span>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm" onClick={onRequestBid}>
            <Palette className="h-4 w-4 mr-1" /> Request to Bid
          </Button>
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link to={`/designers/${designer.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DesignersDirectory() {
  const [showBidDialog, setShowBidDialog] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Find Designers in Northern NJ | SmartReno</title>
        <meta name="description" content="Work with designers who specialize in renovation planning. Browse verified design professionals in Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/designers" />
      </Helmet>

      <MarketingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-medium text-background/80 mb-6">
              <Palette className="h-3.5 w-3.5" />
              Design Professionals
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Work with Designers Who Specialize in Renovation Planning
            </h1>
            <p className="text-lg md:text-xl text-background/70 max-w-2xl mb-8 leading-relaxed">
              Design professionals can collaborate with homeowners early in the renovation process to develop layouts, selections, and project concepts.
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {MOCK_DESIGNERS.length} Designer{MOCK_DESIGNERS.length !== 1 ? "s" : ""} Available
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Northern New Jersey • Verified Professionals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_DESIGNERS.map((designer, i) => (
            <DesignerCard key={designer.id} designer={designer} index={i} onRequestBid={() => setShowBidDialog(true)} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Project?</h2>
          <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
            Start your renovation project and connect with qualified design professionals and contractors.
          </p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-10">
            <Link to="/start-your-renovation">
              Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project First</DialogTitle>
            <DialogDescription className="text-center">
              To request designs from professionals, start by telling us about your project. You'll be able to connect with designers through your project dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button className="w-full" size="lg" onClick={() => { setShowBidDialog(false); navigate("/start-your-renovation"); }}>
              Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => { setShowBidDialog(false); navigate("/login"); }}>
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
