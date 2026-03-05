import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Home, MapPin, Check, Star, TrendingUp, Users, Award, ChevronRight } from 'lucide-react';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { getTownsByCounty } from '@/data/townData';
import { COUNTY_SEO_DATA, buildMetadata, generateBreadcrumbList } from '@/utils/seo';
import { LocalBusinessSchema } from '@/components/seo/JsonLd';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { OptimizedImage } from '@/components/OptimizedImage';
import { CountyMap } from '@/components/CountyMap';
import { COUNTY_STATS, COUNTY_FAQS, COUNTY_TESTIMONIALS } from '@/data/countyData';
import * as T from '@/data/towns';
import bergenCountyImg from '@/assets/counties/bergen-county.jpg';
import passaicCountyImg from '@/assets/counties/passaic-county.jpg';
import morrisCountyImg from '@/assets/counties/morris-county.jpg';
import essexCountyImg from '@/assets/counties/essex-county.jpg';
import hudsonCountyImg from '@/assets/counties/hudson-county.jpg';

const countyMap: Record<string, { name: string; towns: string[]; image: string }> = {
  bergen: { name: 'Bergen County', towns: T.bergen, image: bergenCountyImg },
  passaic: { name: 'Passaic County', towns: T.passaic, image: passaicCountyImg },
  morris: { name: 'Morris County', towns: T.morris, image: morrisCountyImg },
  essex: { name: 'Essex County', towns: T.essex, image: essexCountyImg },
  hudson: { name: 'Hudson County', towns: T.hudson, image: hudsonCountyImg },
};

export default function CountyPage() {
  const { county = '' } = useParams();
  
  // Normalize county param - remove "-county" suffix if present
  const countyKey = county.replace('-county', '');
  
  const entry = countyMap[countyKey];
  const townDataList = getTownsByCounty(countyKey);
  const seoData = COUNTY_SEO_DATA[countyKey];
  const stats = COUNTY_STATS[countyKey];
  const faqs = COUNTY_FAQS[countyKey] || [];
  const testimonials = COUNTY_TESTIMONIALS[countyKey] || [];

  if (!entry) {
    return (
      <>
        <SiteNavbar />
        <main className="container mx-auto px-4 py-10 min-h-screen">
          <p className="text-muted-foreground">County not found</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const metadata = buildMetadata(
    `${entry.name} Home Renovations`,
    `/locations/${county}`,
    { county: entry.name },
    {
      description: seoData?.description || `Professional home renovation services across ${entry.name}. Kitchen, bathroom, basement, additions & exterior remodeling.`,
      keywords: seoData?.keywords || []
    }
  );

  const breadcrumbs = generateBreadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Service Areas', url: '/locations' },
    { name: entry.name, url: `/locations/${county}` }
  ]);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="author" content="SmartReno" />
        <link rel="canonical" href={metadata.canonical} />
        
        <meta property="og:type" content={metadata.type} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content={metadata.canonical} />
        <meta property="og:image" content={metadata.image} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SmartReno" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={metadata.image} />
        
        {metadata.keywords && metadata.keywords.length > 0 && (
          <meta name="keywords" content={metadata.keywords.join(', ')} />
        )}
        
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbs)}
        </script>
      </Helmet>

      <LocalBusinessSchema county={entry.name} />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/locations" className="hover:text-foreground transition-colors">Service Areas</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{entry.name}</span>
            </nav>
          </div>
        </div>
        
        {/* Hero Section with Image */}
        <div className="relative border-b overflow-hidden">
          <div className="absolute inset-0">
            <OptimizedImage
              src={entry.image}
              alt={`${entry.name} renovation services - beautiful homes and neighborhoods`}
              className="w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
          </div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex gap-3 mb-6">
              <Button variant="ghost" asChild size="sm" className="bg-background/80 backdrop-blur-sm hover:bg-background/90">
                <Link to="/locations" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Locations
                </Link>
              </Button>
              <Button variant="ghost" asChild size="sm" className="bg-background/80 backdrop-blur-sm hover:bg-background/90">
                <Link to="/" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Home Renovations in {entry.name}, NJ
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
              {seoData?.description || `Professional home renovation services across ${entry.name}. Kitchen, bathroom, basement, additions & exterior remodeling in all towns.`}
            </p>
            
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to="/homeowners#estimate-form">Get Free Estimate</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <section className="py-12 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Renovation Services in {entry.name}</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3">Kitchen Remodeling</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Custom cabinets & countertops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Layout redesign & expansions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Appliance installation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3">Bathroom Renovations</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Tile & fixture upgrades</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Shower & tub installations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Vanity & storage solutions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3">Basements & Additions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Basement finishing & conversions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Home additions & expansions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Whole-home remodeling</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Serving homeowners across {entry.name} with vetted, insured contractors
              </p>
              <Button asChild size="lg" variant="outline">
                <Link to="/homeowners#how-it-works">How SmartReno Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* County Map Section */}
        <section className="py-12 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold mb-4">Why Choose {entry.name}?</h2>
                <p className="text-muted-foreground mb-6">
                  {entry.name} is ideally located in Northern New Jersey, offering a perfect blend of suburban charm and urban convenience. 
                  Our network of vetted contractors knows the unique architectural styles, building codes, and renovation needs of this region.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Local Expertise</h3>
                      <p className="text-sm text-muted-foreground">Contractors who understand {entry.name} building codes and permits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Quality Service</h3>
                      <p className="text-sm text-muted-foreground">Vetted professionals with proven track records</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Competitive Pricing</h3>
                      <p className="text-sm text-muted-foreground">Compare multiple bids to get the best value</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Fast Response</h3>
                      <p className="text-sm text-muted-foreground">Quick turnaround on estimates and project starts</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <CountyMap countyName={entry.name} />
              </div>
            </div>
          </div>
        </section>

        {/* Towns Section */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">Towns & Cities We Serve in {entry.name}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              SmartReno connects homeowners with trusted renovation contractors throughout {entry.name}
            </p>
            
            {townDataList.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {townDataList.map((town) => (
                  <Link 
                    key={town.slug} 
                    to={`/locations/${countyKey}/${town.slug}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold group-hover:text-accent transition-colors">
                              {town.name}
                            </h3>
                            {town.population && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Pop: {town.population}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {entry.towns.map((townName) => (
                  <Card key={townName} className="border">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{townName}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        {testimonials.length > 0 && (
          <section className="py-12 bg-muted/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-2 text-center">What {entry.name} Homeowners Say</h2>
              <p className="text-center text-muted-foreground mb-8">Real reviews from real renovation projects</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {testimonials.map((testimonial, idx) => (
                  <Card key={idx} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">{testimonial.projectType}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-2 text-center">Frequently Asked Questions</h2>
              <p className="text-center text-muted-foreground mb-8">
                Common questions about home renovations in {entry.name}
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your {entry.name} Renovation?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Get a free estimate and compare bids from vetted contractors in your area
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/homeowners#estimate-form">Request Free Estimate</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
