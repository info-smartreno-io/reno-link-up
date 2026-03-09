import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { useImportedBusiness } from "@/hooks/useImportedBusinesses";
import { findFallbackDesigner } from "@/data/fallbackDesigners";
import { ClaimProfileDialog } from "@/components/directory/ClaimProfileDialog";
import {
  Star, MapPin, Phone, Globe, ArrowLeft, ArrowRight, Palette, BadgeCheck, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function DesignerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: dbBusiness, isLoading } = useImportedBusiness(slug || "");
  const [showClaim, setShowClaim] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);

  // Use DB data first, fall back to local data
  const business = dbBusiness || findFallbackDesigner(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNavbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNavbar />
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">This designer profile doesn't exist or has been removed.</p>
          <Button asChild><Link to="/designers"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Designers</Link></Button>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  const initials = business.business_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = business.business_name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{business.business_name} | Interior Designer in {business.city || "NJ"} | SmartReno</title>
        <meta name="description" content={`${business.business_name} — ${business.category || "Interior Design"} in ${business.city || "NJ"}. View ratings, specialties, and contact info on SmartReno.`} />
      </Helmet>

      <MarketingNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.06),transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-6 py-16 relative">
          <Button variant="ghost" className="text-background/60 hover:text-background mb-6" onClick={() => navigate("/designers")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Designers
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-6"
          >
            {business.photo_url ? (
              <img src={business.photo_url} alt={business.business_name} className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${hue + 30}, 70%, 55%))` }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{business.business_name}</h1>
              {business.category && (
                <p className="text-background/70 mt-1">{business.category}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-background/70 text-sm">
                {business.google_rating && (
                  <span className="flex items-center gap-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(business.google_rating!) ? "fill-pending text-pending" : "text-background/30"}`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-background">{business.google_rating}</span>
                    <span>({business.review_count} reviews)</span>
                  </span>
                )}
                {(business.city || business.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[business.city, business.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              {business.claim_status === "unclaimed" && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs text-background/60 backdrop-blur-sm border border-background/10">
                  <BadgeCheck className="h-3.5 w-3.5" /> Unclaimed Profile
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="md:col-span-2 space-y-8"
          >
            {/* About section */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {business.business_name} is a {(business.category || "interior design").toLowerCase()} firm based in {business.city || "Northern New Jersey"}, NJ. 
                They serve the greater Bergen County area and specialize in residential renovation design and planning.
              </p>
            </div>

            {/* Business Info */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Business Information</h2>
              <div className="space-y-4">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Address</p>
                      <p className="text-muted-foreground text-sm">{business.address}</p>
                    </div>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Phone</p>
                      <a href={`tel:${business.phone}`} className="text-accent text-sm hover:underline">{business.phone}</a>
                    </div>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Website</p>
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline flex items-center gap-1">
                        {business.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {business.map_link && (
                  <a href={business.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-accent hover:underline mt-2">
                    View on Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Service Areas / Specialties */}
            {business.service_area_tags && business.service_area_tags.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Specialties & Service Area</h2>
                <div className="flex flex-wrap gap-2">
                  {business.service_area_tags.map((tag) => (
                    <span key={tag} className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl" size="lg" onClick={() => setShowBidDialog(true)}>
                <Palette className="h-4 w-4 mr-2" /> Request to Bid
              </Button>
              
              {business.claim_status === "unclaimed" && (
                <Button variant="outline" className="w-full rounded-xl" size="lg" onClick={() => setShowClaim(true)}>
                  <BadgeCheck className="h-4 w-4 mr-2" /> Claim This Profile
                </Button>
              )}
            </div>

            {business.google_rating && (
              <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(business.google_rating!) ? "fill-pending text-pending" : "text-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-3xl font-bold text-foreground">{business.google_rating}</span>
                <p className="text-sm text-muted-foreground mt-1">{business.review_count} Google Reviews</p>
              </div>
            )}

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h3 className="font-semibold text-foreground text-sm mb-3">Why SmartReno?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  Get matched with verified professionals
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  Compare multiple design proposals
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  Structured renovation planning
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-foreground via-foreground/97 to-foreground/93 text-background py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Renovation?</h2>
          <p className="text-background/70 mb-8">SmartReno structures your renovation before construction begins.</p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 rounded-xl">
            <Link to="/start-your-renovation">Start Your Project <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />

      {business.claim_status === "unclaimed" && (
        <ClaimProfileDialog
          open={showClaim}
          onOpenChange={setShowClaim}
          businessId={business.id}
          businessName={business.business_name}
        />
      )}

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Palette className="h-6 w-6 text-accent" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project First</DialogTitle>
            <DialogDescription className="text-center">
              To connect with {business.business_name}, start by telling us about your project. You'll be matched through your project dashboard.
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
