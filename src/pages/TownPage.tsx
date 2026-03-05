import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, MapPin, DollarSign, Users, CheckCircle, ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getTownBySlug } from "@/data/townData";
import { trackEvent } from "@/utils/analytics";
import kitchenImage from "@/assets/kitchen-remodel.jpg";
import bathroomImage from "@/assets/bathroom-remodel.jpg";
import basementImage from "@/assets/basement-finished.jpg";
import additionImage from "@/assets/home-addition.jpg";

/**
 * TownPage - SEO-optimized town-specific landing pages
 * Generates unique pages for each town in Northern NJ
 * Features: Local SEO, structured data, unique content per town
 */
export default function TownPage() {
  const { county = "", town = "" } = useParams();
  const townData = getTownBySlug(county, town);

  if (!townData) {
    return (
      <>
        <SiteNavbar />
        <main className="container mx-auto px-4 py-10 min-h-screen">
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Town Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find information for this location.
            </p>
            <Button asChild>
              <Link to="/locations">View All Locations</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{townData.metaTitle}</title>
        <meta name="description" content={townData.metaDescription} />
        <link rel="canonical" href={`https://smartreno.io/locations/${county}/${town}`} />
        <meta name="robots" content="index,follow" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={townData.metaTitle} />
        <meta property="og:description" content={townData.metaDescription} />
        <meta property="og:url" content={`https://smartreno.io/locations/${county}/${town}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={townData.metaTitle} />
        <meta name="twitter:description" content={townData.metaDescription} />
        
        {/* JSON-LD Structured Data - LocalBusiness */}
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
              "containedIn": {
                "@type": "AdministrativeArea",
                "name": townData.county
              }
            },
            "serviceType": "Home Renovation Services",
            "priceRange": "$$",
            "telephone": "(201) 788-9502",
            "email": "info@smartreno.io"
          })}
        </script>
        
        {/* JSON-LD - Service */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Home Renovation",
            "provider": {
              "@type": "Organization",
              "name": "SmartReno",
              "url": "https://smartreno.io/"
            },
            "areaServed": {
              "@type": "City",
              "name": townData.name,
              "addressRegion": "NJ"
            },
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": "https://smartreno.io/get-estimate"
            }
          })}
        </script>
        
        {/* JSON-LD - BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartreno.io/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Locations",
                "item": "https://smartreno.io/locations"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": townData.county,
                "item": `https://smartreno.io/locations/${county}`
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": townData.name,
                "item": `https://smartreno.io/locations/${county}/${town}`
              }
            ]
          })}
        </script>
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 mb-8">
              <Link to="#kitchens" className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors">
                Kitchens
              </Link>
              <Link to="#bathrooms" className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors">
                Bathrooms
              </Link>
              <Link to="#basements" className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors">
                Basements
              </Link>
              <Link to="#additions" className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors">
                Additions
              </Link>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Home Renovations in {townData.name}, NJ – Kitchen, Bath, Basement & Additions
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {townData.name}'s {townData.county === 'Bergen County' ? 'established neighborhoods and quality homes make it' : 'strong community and housing market make it'} ideal for renovation projects planned through SmartReno.
            </p>

            <Button 
              size="lg" 
              asChild
              onClick={() => trackEvent('town_page_cta_click', {
                town: townData.name,
                county: townData.county,
                cta_location: 'hero'
              })}
            >
              <Link to="/get-estimate">
                Get Free Estimate
              </Link>
            </Button>
          </div>
        </section>

        {/* Planning Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Planning Your Home Renovation in {townData.name}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Whether you're remodeling your kitchen, updating bathrooms, finishing your basement, or adding space with an addition, SmartReno provides the tools and connections you need for your renovation in {townData.name}, {townData.county}.
            </p>

            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
              Our free cost calculator helps you understand budget ranges based on local construction costs, while our network of vetted contractors ensures you're working with experienced professionals who know {townData.name} building codes and permitting requirements.
            </p>

            <div>
              <h3 className="text-2xl font-bold mb-6">Popular Renovation Projects in {townData.name}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="text-center p-6 hover:shadow-md transition-shadow">
                  <CardTitle className="text-lg mb-2">Kitchens</CardTitle>
                  <p className="text-sm text-muted-foreground">Modern remodels</p>
                </Card>
                <Card className="text-center p-6 hover:shadow-md transition-shadow">
                  <CardTitle className="text-lg mb-2">Bathrooms</CardTitle>
                  <p className="text-sm text-muted-foreground">Luxury upgrades</p>
                </Card>
                <Card className="text-center p-6 hover:shadow-md transition-shadow">
                  <CardTitle className="text-lg mb-2">Basements</CardTitle>
                  <p className="text-sm text-muted-foreground">Finished living space</p>
                </Card>
                <Card className="text-center p-6 hover:shadow-md transition-shadow">
                  <CardTitle className="text-lg mb-2">Additions</CardTitle>
                  <p className="text-sm text-muted-foreground">Expand your home</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* About Town Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              About {townData.name}
            </h2>
            
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-6 leading-relaxed">
                {townData.name} is a distinctive community in {townData.county}, known for its strong community character and excellent quality of life. Homeowners here often choose to renovate and expand their existing properties rather than relocate, taking advantage of the town's desirable location and established neighborhoods.
              </p>

              <p className="leading-relaxed">
                The local housing market in {townData.name} supports home renovation investments, with property values that reflect both the desirability of the area and the quality of homes. Whether you're updating your kitchen, adding a bathroom, finishing a basement, or expanding with an addition, renovations in {townData.name} typically provide strong returns while allowing you to stay in the community you love.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">
              Why Homeowners Choose Renovations in {townData.name}
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Stay in Your Neighborhood</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {townData.name} residents value their community connections. Renovating your current home allows you to improve your living space without leaving the neighborhood, schools, and local amenities you love.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Maximize Your Property Value</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Well-planned renovations typically add significant value to {townData.name} homes. Kitchen and bathroom remodels often return 60-80% of investment, while additions and basement finishes provide immediate lifestyle benefits.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Customize to Your Needs</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Unlike buying a new home, renovations let you design exactly what you need—whether that's a gourmet kitchen, spa bathroom, finished basement, or added square footage for your growing family.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Renovation Types Detail Sections */}
        <section id="kitchens" className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Kitchen Remodeling in {townData.name}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Kitchen renovations are among the most popular projects in {townData.name}. Modern kitchens combine functionality with style, featuring custom cabinetry, quartz or granite countertops, stainless steel appliances, and open layouts that serve as the heart of the home.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Whether you're doing a complete gut renovation or updating finishes, SmartReno connects you with experienced kitchen contractors who understand {townData.name} design trends and building requirements.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={kitchenImage} 
                  alt="Modern kitchen remodel in New Jersey home with white cabinets and marble countertops" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="bathrooms" className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="order-2 md:order-1 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={bathroomImage} 
                  alt="Luxury bathroom renovation with walk-in shower and soaking tub" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Bathroom Renovations in {townData.name}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Bathroom remodels in {townData.name} range from simple updates to luxury spa-like retreats. Popular upgrades include walk-in showers, soaking tubs, heated floors, double vanities, and high-end tile work.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  From powder rooms to primary suites, our vetted contractors bring expertise in plumbing, waterproofing, and finish work to ensure your bathroom renovation meets both aesthetic and functional goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="basements" className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Basement Finishing in {townData.name}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Finished basements add valuable living space to {townData.name} homes. Popular uses include family rooms, home theaters, home offices, gyms, guest suites, and playrooms. Basement finishing requires expertise in waterproofing, insulation, egress requirements, and HVAC.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our network includes contractors experienced with {townData.name} basement conditions and local code requirements for safe, comfortable below-grade living spaces.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={basementImage} 
                  alt="Finished basement family room with entertainment center and comfortable seating" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="additions" className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="order-2 md:order-1 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={additionImage} 
                  alt="Home addition exterior showing seamless architectural integration" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Home Additions in {townData.name}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  When you need more space, home additions offer a solution without relocating. Popular addition types in {townData.name} include first-floor extensions for expanded kitchens or primary suites, add-a-level projects that double your square footage, and dormer additions that transform attic space.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Additions require architectural design, structural engineering, and coordination with local zoning and building departments. SmartReno's contractor network includes firms experienced with the full addition process in {townData.name}.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-primary/5">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Plan Your {townData.name} Renovation?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get started with SmartReno's free cost calculator and connect with vetted contractors who specialize in {townData.name} renovations and understand local building codes.
            </p>
            <Button 
              size="lg" 
              asChild
              onClick={() => trackEvent('town_page_cta_click', {
                town: townData.name,
                county: townData.county,
                cta_location: 'bottom'
              })}
            >
              <Link to="/get-estimate">
                Get Free Estimate
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer Links */}
        <section className="py-12 border-t">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-muted-foreground mb-4">
              More locations in {townData.county}:
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link to={`/locations/${county}`}>
                  View All {townData.county} Towns
                </Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link to="/locations">
                  All Service Areas
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
