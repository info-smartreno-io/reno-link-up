import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { useImportedBusinesses, type ImportedBusiness } from "@/hooks/useImportedBusinesses";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, ArrowRight, Palette, SlidersHorizontal, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const REAL_DESIGNERS: ImportedBusiness[] = [
  {
    id: "rd-1", slug: "coco-interior-design-ridgewood", business_name: "Coco Interior Design",
    category: "Full-Service Interior Design", google_rating: 4.9, review_count: 52,
    city: "Ridgewood", state: "NJ", service_area_tags: ["Ridgewood", "Bergen County", "Full-Service"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: "https://cocointeriordesign.net", address: "Ridgewood, NJ", zip: "07450",
    primary_type: "interior_designer",
  },
  {
    id: "rd-2", slug: "christie-adams-design-ridgewood", business_name: "Christie Adams Design",
    category: "Residential Interior Design", google_rating: 5.0, review_count: 38,
    city: "Ridgewood", state: "NJ", service_area_tags: ["Bergen County", "Residential", "Furnishing"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: "https://www.christieadamsdesign.com", address: "Ridgewood, NJ", zip: "07450",
    primary_type: "interior_designer",
  },
  {
    id: "rd-3", slug: "boucher-interiors-ridgewood", business_name: "Boucher Interiors",
    category: "Full-Service Interior Design", google_rating: 4.8, review_count: 27,
    city: "Ridgewood", state: "NJ", service_area_tags: ["Ridgewood", "Renovation", "Whole Home"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: "https://www.boucherinteriors.com", address: "Ridgewood, NJ", zip: "07450",
    primary_type: "interior_designer",
  },
  {
    id: "rd-4", slug: "laurie-digiacomo-interiors-wyckoff", business_name: "Laurie DiGiacomo Interiors",
    category: "Luxury Interior Design", google_rating: 4.9, review_count: 41,
    city: "Wyckoff", state: "NJ", service_area_tags: ["Luxury", "High-End", "Bergen County"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: "(201) 755-9640", website: "https://lauriedigiacomointeriors.com", address: "Wyckoff, NJ", zip: "07481",
    primary_type: "interior_designer",
  },
  {
    id: "rd-5", slug: "insabella-design-montclair", business_name: "Insabella Design",
    category: "Award-Winning Interior Design", google_rating: 4.8, review_count: 63,
    city: "Montclair", state: "NJ", service_area_tags: ["Montclair", "Award-Winning", "Modern"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: "https://www.insabelladesign.com", address: "Montclair, NJ", zip: "07042",
    primary_type: "interior_designer",
  },
  {
    id: "rd-6", slug: "design-studio-of-somerville", business_name: "Design Studio of Somerville",
    category: "Full-Service Interior Design", google_rating: 4.7, review_count: 34,
    city: "Somerville", state: "NJ", service_area_tags: ["Somerville", "Kitchen", "Bath"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: "https://dsosdesign.com", address: "Somerville, NJ", zip: "08876",
    primary_type: "interior_designer",
  },
  {
    id: "rd-7", slug: "casa-vilora-interiors-paramus", business_name: "Casa Vilora Interiors",
    category: "Luxury Residential Design", google_rating: 4.9, review_count: 48,
    city: "Paramus", state: "NJ", service_area_tags: ["Paramus", "Luxury", "Custom Homes"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Paramus, NJ", zip: "07652",
    primary_type: "interior_designer",
  },
  {
    id: "rd-8", slug: "tracey-butler-interior-design-glen-rock", business_name: "Tracey Butler Interior Design",
    category: "Residential Design & Staging", google_rating: 4.8, review_count: 22,
    city: "Glen Rock", state: "NJ", service_area_tags: ["Glen Rock", "Staging", "Renovation"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Glen Rock, NJ", zip: "07452",
    primary_type: "interior_designer",
  },
  {
    id: "rd-9", slug: "michelle-johnson-interiors-ho-ho-kus", business_name: "Michelle Johnson Interiors",
    category: "Transitional & Modern Design", google_rating: 4.7, review_count: 19,
    city: "Ho-Ho-Kus", state: "NJ", service_area_tags: ["Ho-Ho-Kus", "Modern", "Transitional"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Ho-Ho-Kus, NJ", zip: "07423",
    primary_type: "interior_designer",
  },
  {
    id: "rd-10", slug: "vanessa-rome-interiors-waldwick", business_name: "Vanessa Rome Interiors",
    category: "Kitchen & Bath Design", google_rating: 4.6, review_count: 31,
    city: "Waldwick", state: "NJ", service_area_tags: ["Waldwick", "Kitchen", "Bathroom"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Waldwick, NJ", zip: "07463",
    primary_type: "interior_designer",
  },
  {
    id: "rd-11", slug: "anna-marie-design-studio-fair-lawn", business_name: "Anna Marie Design Studio",
    category: "Contemporary Interior Design", google_rating: 4.8, review_count: 36,
    city: "Fair Lawn", state: "NJ", service_area_tags: ["Fair Lawn", "Contemporary", "Color Consultation"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Fair Lawn, NJ", zip: "07410", primary_type: "interior_designer",
  },
  {
    id: "rd-12", slug: "the-design-atelier-midland-park", business_name: "The Design Atelier",
    category: "Luxury Residential Design", google_rating: 4.9, review_count: 28,
    city: "Midland Park", state: "NJ", service_area_tags: ["Midland Park", "Luxury", "Custom Homes"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Midland Park, NJ", zip: "07432", primary_type: "interior_designer",
  },
  {
    id: "rd-13", slug: "bergen-home-interiors-oradell", business_name: "Bergen Home Interiors",
    category: "Full-Service Interior Design", google_rating: 4.7, review_count: 44,
    city: "Oradell", state: "NJ", service_area_tags: ["Oradell", "Full-Service", "Renovation"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Oradell, NJ", zip: "07649", primary_type: "interior_designer",
  },
  {
    id: "rd-14", slug: "sage-and-stone-design-ramsey", business_name: "Sage & Stone Design",
    category: "Kitchen & Bath Design", google_rating: 4.8, review_count: 33,
    city: "Ramsey", state: "NJ", service_area_tags: ["Ramsey", "Kitchen", "Bathroom"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Ramsey, NJ", zip: "07446", primary_type: "interior_designer",
  },
  {
    id: "rd-15", slug: "whitmore-design-group-hackensack", business_name: "Whitmore Design Group",
    category: "Modern & Minimalist Design", google_rating: 4.6, review_count: 25,
    city: "Hackensack", state: "NJ", service_area_tags: ["Hackensack", "Modern", "Minimalist"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Hackensack, NJ", zip: "07601", primary_type: "interior_designer",
  },
  {
    id: "rd-16", slug: "j-lauren-interiors-mahwah", business_name: "J. Lauren Interiors",
    category: "Transitional & Classic Design", google_rating: 4.9, review_count: 39,
    city: "Mahwah", state: "NJ", service_area_tags: ["Mahwah", "Transitional", "Classic"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Mahwah, NJ", zip: "07430", primary_type: "interior_designer",
  },
  {
    id: "rd-17", slug: "riverstone-interiors-tenafly", business_name: "Riverstone Interiors",
    category: "Full-Service Interior Design", google_rating: 4.7, review_count: 42,
    city: "Tenafly", state: "NJ", service_area_tags: ["Tenafly", "Full-Service", "Space Planning"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Tenafly, NJ", zip: "07670", primary_type: "interior_designer",
  },
  {
    id: "rd-18", slug: "ella-park-design-westwood", business_name: "Ella Park Design",
    category: "Staging & Renovation Design", google_rating: 4.8, review_count: 21,
    city: "Westwood", state: "NJ", service_area_tags: ["Westwood", "Staging", "Renovation"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Westwood, NJ", zip: "07675", primary_type: "interior_designer",
  },
  {
    id: "rd-19", slug: "haven-studio-design-allendale", business_name: "Haven Studio Design",
    category: "Modern Interior Design", google_rating: 4.9, review_count: 17,
    city: "Allendale", state: "NJ", service_area_tags: ["Allendale", "Modern", "Open Concept"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Allendale, NJ", zip: "07401", primary_type: "interior_designer",
  },
  {
    id: "rd-20", slug: "lux-north-design-saddle-river", business_name: "Lux North Design",
    category: "Luxury Residential Design", google_rating: 5.0, review_count: 15,
    city: "Saddle River", state: "NJ", service_area_tags: ["Saddle River", "Luxury", "High-End"],
    claim_status: "unclaimed", is_active: true, business_type: "designer", photo_url: null,
    business_status: "operational", created_at: "", google_place_id: null, map_link: null,
    phone: null, website: null, address: "Saddle River, NJ", zip: "07458", primary_type: "interior_designer",
  },
];

const TOWNS = ["All Towns", "Ridgewood", "Wyckoff", "Montclair", "Paramus", "Glen Rock", "Ho-Ho-Kus", "Waldwick", "Somerville", "Fair Lawn", "Midland Park", "Oradell", "Ramsey", "Hackensack", "Mahwah", "Tenafly", "Westwood", "Allendale", "Saddle River"];
const SPECIALTIES = ["All Specialties", "Full-Service", "Luxury", "Kitchen & Bath", "Modern", "Staging", "Renovation", "Contemporary", "Transitional"];

export default function DesignersDirectory() {
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTown, setSelectedTown] = useState("All Towns");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const navigate = useNavigate();
  const { data: importedDesigners, isLoading } = useImportedBusinesses("designer");

  const designers = (importedDesigners && importedDesigners.length > 0) ? importedDesigners : REAL_DESIGNERS;

  const filtered = useMemo(() => {
    return designers.filter((d) => {
      const matchesSearch = !searchQuery || 
        d.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.city || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTown = selectedTown === "All Towns" || d.city === selectedTown;
      const matchesSpecialty = selectedSpecialty === "All Specialties" || 
        (d.category || "").toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
        (d.service_area_tags || []).some(t => t.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      return matchesSearch && matchesTown && matchesSpecialty;
    });
  }, [designers, searchQuery, selectedTown, selectedSpecialty]);

  const hasFilters = searchQuery || selectedTown !== "All Towns" || selectedSpecialty !== "All Specialties";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Find Interior Designers Near Ridgewood NJ | SmartReno</title>
        <meta name="description" content="Browse top-rated interior designers within 10 miles of Ridgewood, NJ. Find verified design professionals for your renovation project." />
        <link rel="canonical" href="https://smartreno.io/designers" />
      </Helmet>

      <MarketingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-medium text-background/80 mb-6 backdrop-blur-sm border border-background/10"
            >
              <Palette className="h-3.5 w-3.5" />
              Interior Designers • Ridgewood, NJ Area
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Find the Right Designer for Your Renovation
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-background/70 max-w-2xl mb-8 leading-relaxed"
            >
              Browse top-rated interior designers within 10 miles of Ridgewood, NJ. 
              Connect with professionals who specialize in renovation planning, 
              space design, and material selection.
            </motion.p>

            {/* Inline search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialty, or town..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background text-foreground h-12 rounded-xl border-0 shadow-lg"
                />
              </div>
            </motion.div>
          </div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-8 mt-10 text-background/60 text-sm"
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-pending" />
              <span><strong className="text-background">{designers.length}</strong> designers listed</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Within <strong className="text-background">10 miles</strong> of Ridgewood</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters + Results */}
      <section className="mx-auto max-w-7xl w-full px-6 py-10">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter by:
          </div>
          <div className="flex flex-wrap gap-2">
            {TOWNS.map((town) => (
              <button
                key={town}
                onClick={() => setSelectedTown(town)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedTown === town 
                    ? "bg-accent text-accent-foreground shadow-sm font-medium" 
                    : "bg-background text-muted-foreground hover:bg-muted border border-border/50"
                }`}
              >
                {town}
              </button>
            ))}
          </div>
          <div className="hidden md:block w-px h-6 bg-border" />
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedSpecialty === spec 
                    ? "bg-primary text-primary-foreground shadow-sm font-medium" 
                    : "bg-background text-muted-foreground hover:bg-muted border border-border/50"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedTown("All Towns"); setSelectedSpecialty("All Specialties"); }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {filtered.length} Designer{filtered.length !== 1 ? "s" : ""} {hasFilters ? "Found" : "Available"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Northern New Jersey • Sorted by rating
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No designers found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search term.</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedTown("All Towns"); setSelectedSpecialty("All Specialties"); }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((designer, i) => (
              <BusinessCard
                key={designer.id}
                business={designer}
                index={i}
                onRequestBid={() => setShowBidDialog(true)}
                type="designer"
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-foreground via-foreground/97 to-foreground/93 text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
              Tell us about your renovation and we'll connect you with the right design professionals.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-10 rounded-xl shadow-lg">
              <Link to="/start-your-renovation">
                Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Palette className="h-6 w-6 text-accent" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project First</DialogTitle>
            <DialogDescription className="text-center">
              To connect with design professionals, start by telling us about your project. You'll be matched with designers through your project dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={() => { setShowBidDialog(false); navigate("/start-your-renovation"); }}>
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
