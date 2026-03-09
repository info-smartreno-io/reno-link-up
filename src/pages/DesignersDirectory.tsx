import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { useImportedBusinesses, type ImportedBusiness } from "@/hooks/useImportedBusinesses";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, CheckCircle2, Shield, Award,
  ArrowRight, Palette,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// Fallback mock data when no imported businesses exist
const MOCK_DESIGNERS = [
  {
    id: "mock-1", slug: "studio-ren-design", business_name: "Studio Ren Design", category: "Kitchen & Bath Design",
    google_rating: 4.9, review_count: 84, city: "Ridgewood", state: "NJ",
    service_area_tags: ["Kitchen", "Bathroom", "Open Concept"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
  {
    id: "mock-2", slug: "northstar-interiors", business_name: "NorthStar Interiors", category: "Full Home Design",
    google_rating: 4.8, review_count: 62, city: "Montclair", state: "NJ",
    service_area_tags: ["Whole Home", "Color Consultation", "Space Planning"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
  {
    id: "mock-3", slug: "blueprint-living", business_name: "Blueprint Living", category: "Renovation Planning",
    google_rating: 4.7, review_count: 47, city: "Glen Rock", state: "NJ",
    service_area_tags: ["Renovations", "Layout Design", "Material Selection"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
  {
    id: "mock-4", slug: "elevated-spaces", business_name: "Elevated Spaces", category: "Luxury Residential",
    google_rating: 4.9, review_count: 93, city: "Short Hills", state: "NJ",
    service_area_tags: ["Luxury", "Custom Homes", "Additions"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
  {
    id: "mock-5", slug: "form-function-design", business_name: "Form & Function Design", category: "Modern Minimalist",
    google_rating: 4.6, review_count: 38, city: "Hoboken", state: "NJ",
    service_area_tags: ["Modern", "Minimalist", "Small Spaces"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
  {
    id: "mock-6", slug: "heritage-home-design", business_name: "Heritage Home Design", category: "Traditional & Classic",
    google_rating: 4.8, review_count: 71, city: "Morristown", state: "NJ",
    service_area_tags: ["Traditional", "Colonial", "Historic Homes"], claim_status: "unclaimed", is_active: true,
    business_type: "designer", photo_url: null, business_status: "operational", created_at: "",
    google_place_id: null, map_link: null, phone: null, website: null, address: null, zip: null, primary_type: null,
  },
] as ImportedBusiness[];

export default function DesignersDirectory() {
  const [showBidDialog, setShowBidDialog] = useState(false);
  const navigate = useNavigate();
  const { data: importedDesigners, isLoading } = useImportedBusinesses("designer");

  // Use imported if available, otherwise fall back to mock
  const designers = (importedDesigners && importedDesigners.length > 0) ? importedDesigners : MOCK_DESIGNERS;

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
              {designers.length} Designer{designers.length !== 1 ? "s" : ""} Available
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Northern New Jersey • Verified Professionals</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading designers...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designers.map((designer, i) => (
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
