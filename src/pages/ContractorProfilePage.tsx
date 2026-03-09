import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { useImportedBusiness } from "@/hooks/useImportedBusinesses";
import { ClaimProfileDialog } from "@/components/directory/ClaimProfileDialog";
import {
  Star, MapPin, Phone, Globe, ArrowLeft, ArrowRight, Hammer, BadgeCheck, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ContractorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: business, isLoading } = useImportedBusiness(slug || "");
  const [showClaim, setShowClaim] = useState(false);

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
          <p className="text-muted-foreground mb-6">This contractor profile doesn't exist or has been removed.</p>
          <Button asChild><Link to="/contractors"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Contractors</Link></Button>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  const initials = business.business_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{business.business_name} | SmartReno Contractor Directory</title>
        <meta name="description" content={`${business.business_name} in ${business.city || "NJ"} - View profile, ratings, and contact info on SmartReno.`} />
      </Helmet>

      <MarketingNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-background">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Button variant="ghost" className="text-background/60 hover:text-background mb-6" onClick={() => navigate("/contractors")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contractors
          </Button>

          <div className="flex items-start gap-6">
            {business.photo_url ? (
              <img src={business.photo_url} alt={business.business_name} className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{business.business_name}</h1>
              {business.category && (
                <p className="text-background/70 mt-1 capitalize">{business.category.replace(/_/g, " ")}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-background/70 text-sm">
                {business.google_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {business.google_rating} ({business.review_count} reviews)
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
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs text-background/60">
                  <BadgeCheck className="h-3.5 w-3.5" /> Unclaimed Profile
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Business Information</h2>
              <div className="space-y-3">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground text-sm">{business.address}</p>
                    </div>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <a href={`tel:${business.phone}`} className="text-primary text-sm hover:underline">{business.phone}</a>
                    </div>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Website</p>
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1">
                        {business.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {business.map_link && (
                  <a href={business.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2">
                    View on Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {business.service_area_tags && business.service_area_tags.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Service Area</h2>
                <div className="flex flex-wrap gap-2">
                  {business.service_area_tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => navigate("/start-your-renovation")}>
              <Hammer className="h-4 w-4 mr-2" /> Start Your Project
            </Button>
            
            {business.claim_status === "unclaimed" && (
              <Button variant="outline" className="w-full" size="lg" onClick={() => setShowClaim(true)}>
                <BadgeCheck className="h-4 w-4 mr-2" /> Claim This Profile
              </Button>
            )}

            {business.google_rating && (
              <div className="rounded-xl border border-border p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold text-foreground">{business.google_rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">{business.review_count} Google Reviews</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Renovation?</h2>
          <p className="text-background/70 mb-8">SmartReno protects your time, money and home.</p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 px-10">
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
    </div>
  );
}
