import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Shield, Users, Clock, BadgeCheck, Hammer, ArrowRight, CheckCircle, FileText } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getTownBySlug } from "@/data/townData";
import { trackEvent } from "@/utils/analytics";
import { motion } from "framer-motion";
import kitchenImage from "@/assets/kitchen-remodel.jpg";
import bathroomImage from "@/assets/bathroom-remodel.jpg";
import basementImage from "@/assets/basement-finished.jpg";
import additionImage from "@/assets/home-addition.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function TownPage() {
  const { county = "", town = "" } = useParams();
  const townData = getTownBySlug(county, town);
  const navigate = useNavigate();
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  if (!townData) {
    return (
      <>
        <SiteNavbar />
        <main className="container mx-auto px-4 py-10 min-h-screen">
          <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Town Not Found</h1>
            <p className="text-muted-foreground">We couldn't find information for this location.</p>
            <div className="space-y-2 py-4 border-y border-border">
              <p className="text-lg font-bold text-primary">SmartReno protects your time, money and home.</p>
              <p className="text-sm text-muted-foreground italic">The first step before you renovate.</p>
            </div>
            <Button asChild>
              <Link to="/locations">View All Locations</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const renovationTypes = [
    { title: "Kitchen Remodels", image: kitchenImage, alt: "Modern kitchen remodel", desc: "Custom cabinetry, countertops, and modern layouts" },
    { title: "Bathroom Renovations", image: bathroomImage, alt: "Luxury bathroom renovation", desc: "Walk-in showers, vanities, and spa-like retreats" },
    { title: "Basement Finishing", image: basementImage, alt: "Finished basement", desc: "Family rooms, home offices, and entertainment spaces" },
    { title: "Home Additions", image: additionImage, alt: "Home addition", desc: "Expand your living space with expert additions" },
  ];

  return (
    <>
      <Helmet>
        <title>{townData.metaTitle}</title>
        <meta name="description" content={townData.metaDescription} />
        <link rel="canonical" href={`https://smartreno.io/locations/${county}/${town}`} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={townData.metaTitle} />
        <meta property="og:description" content={townData.metaDescription} />
        <meta property="og:url" content={`https://smartreno.io/locations/${county}/${town}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `SmartReno - ${townData.name}`,
            "url": `https://smartreno.io/locations/${county}/${town}`,
            "description": townData.metaDescription,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": townData.name,
              "addressRegion": "NJ",
              "addressCountry": "US",
              "postalCode": townData.zipCodes[0]
            },
            "areaServed": {
              "@type": "City",
              "name": townData.name,
              "containedIn": { "@type": "AdministrativeArea", "name": townData.county }
            },
            "serviceType": "Home Renovation Services",
            "priceRange": "$$",
            "telephone": "(201) 788-9502",
            "email": "info@smartreno.io"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smartreno.io/" },
              { "@type": "ListItem", "position": 2, "name": "Locations", "item": "https://smartreno.io/locations" },
              { "@type": "ListItem", "position": 3, "name": townData.county, "item": `https://smartreno.io/locations/${county}` },
              { "@type": "ListItem", "position": 4, "name": townData.name, "item": `https://smartreno.io/locations/${county}/${town}` }
            ]
          })}
        </script>
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
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
              Home Renovations in {townData.name}, NJ
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
            >
              SmartReno protects your time, money and home. Get your project scoped and receive 3 qualified bids from vetted contractors in {townData.name}.
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8"
            >
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 px-10 py-4 text-lg font-bold rounded-xl shadow-lg h-auto"
                onClick={() => {
                  trackEvent('town_page_cta_click', { town: townData.name, county: townData.county, cta_location: 'hero' });
                  navigate("/start-your-renovation");
                }}
              >
                <Hammer className="mr-2 h-5 w-5" /> Start Your Project
              </Button>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
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

        {/* Renovation Types Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Popular Renovations in {townData.name}
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Whether you're remodeling your kitchen, updating bathrooms, finishing your basement, or adding space — SmartReno connects you with vetted contractors who know {townData.name}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {renovationTypes.map((reno, i) => (
                <motion.div
                  key={reno.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => setShowProjectDialog(true)}>
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={reno.image} alt={reno.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-foreground mb-1">{reno.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{reno.desc}</p>
                      <Button size="sm" className="w-full" variant="outline" onClick={(e) => { e.stopPropagation(); setShowProjectDialog(true); }}>
                        <FileText className="h-4 w-4 mr-1" /> Request to Bid
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Town */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">About {townData.name}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {townData.name} is a distinctive community in {townData.county}, known for its strong community character and excellent quality of life. Homeowners here often choose to renovate and expand their existing properties rather than relocate.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The local housing market in {townData.name} supports home renovation investments. Whether you're updating your kitchen, adding a bathroom, finishing a basement, or expanding with an addition, renovations in {townData.name} typically provide strong returns.
            </p>
          </div>
        </section>

        {/* Why Homeowners Choose SmartReno */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              Why {townData.name} Homeowners Choose SmartReno
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Protect Your Time", desc: "No chasing contractors. We scope the work, vet the pros, and deliver 3 qualified bids to you." },
                { title: "Protect Your Money", desc: "Structured bidding with detailed scopes prevents surprises and ensures fair, competitive pricing." },
                { title: "Protect Your Home", desc: "Every contractor is licensed, insured, and verified. We only work with proven professionals." },
                { title: "Local Expertise", desc: `Our contractors know ${townData.name} building codes, permitting requirements, and design trends.` },
              ].map((item) => (
                <Card key={item.title} className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary py-16 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Your {townData.name} Renovation?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              SmartReno protects your time, money and home. A construction agent will scope the work and you'll receive 3 qualified bids from vetted contractors.
            </p>
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 px-10 py-4 text-lg font-bold rounded-xl shadow-md h-auto"
              onClick={() => {
                trackEvent('town_page_cta_click', { town: townData.name, county: townData.county, cta_location: 'bottom' });
                navigate("/start-your-renovation");
              }}
            >
              <Hammer className="mr-2 h-5 w-5" /> Start Your Project
            </Button>
          </div>
        </section>

        {/* Location Links */}
        <section className="py-12 border-t">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-muted-foreground mb-4">
              More locations in {townData.county}:
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link to={`/locations/${county}`}>View All {townData.county} Towns</Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link to="/locations">All Service Areas</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Start Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project</DialogTitle>
            <DialogDescription className="text-center">
              Tell us about your renovation in {townData.name}. A SmartReno construction agent will come to your home, scope the work, and you'll receive 3 qualified bids from vetted contractors.
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
                setShowProjectDialog(false);
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
                  setShowProjectDialog(false);
                  navigate("/login");
                }}
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
