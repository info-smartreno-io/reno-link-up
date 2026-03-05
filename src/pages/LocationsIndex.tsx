import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteNavbar } from '@/components/SiteNavbar'
import { SiteFooter } from '@/components/SiteFooter'
import { bergen, passaic, morris, essex, hudson } from '@/data/towns'

export default function LocationsIndex() {
  const counties = [
    { 
      slug: 'bergen', 
      name: 'Bergen County', 
      towns: bergen,
      description: 'Premier renovation services across Bergen County, serving affluent communities from Ridgewood to Fort Lee. We specialize in high-end kitchen remodels, luxury bathroom upgrades, home additions, and exterior improvements.',
      highlights: ['Kitchen Remodels', 'Bathroom Upgrades', 'Home Additions', 'Exterior Siding']
    },
    { 
      slug: 'passaic', 
      name: 'Passaic County',
      towns: passaic,
      description: 'Complete renovation solutions throughout Passaic County. From Wayne to Clifton, we deliver quality bathroom remodels, exterior improvements, and basement finishing with expert craftsmanship.',
      highlights: ['Bathroom Remodels', 'Basement Finishing', 'Exterior Work', 'Full Renovations']
    },
    { 
      slug: 'morris', 
      name: 'Morris County',
      towns: morris,
      description: 'Transform your Morris County home with our comprehensive renovation services. Serving Morristown, Parsippany, and surrounding areas with basement egress solutions, home additions, and full-home updates.',
      highlights: ['Basement Egress', 'Home Additions', 'Kitchen & Bath', 'Full Home Updates']
    },
    { 
      slug: 'essex', 
      name: 'Essex County',
      towns: essex,
      description: 'Specialized in updating classic Essex County homes in Montclair, Maplewood, and Livingston. Our team expertly handles historic home renovations while maintaining architectural integrity.',
      highlights: ['Historic Renovations', 'Kitchen Modernization', 'Bathroom Updates', 'Additions']
    },
    { 
      slug: 'hudson', 
      name: 'Hudson County',
      towns: hudson,
      description: 'Expert condo and apartment renovations throughout Hudson County. We navigate HOA requirements and handle permits for Hoboken, Jersey City, and Bayonne properties with ease.',
      highlights: ['Condo Renovations', 'HOA Coordination', 'Kitchen & Bath', 'Permit Management']
    },
  ]

  return (
    <>
      <Helmet>
        <title>Service Locations - Home Renovation Services in Northern NJ | SmartReno</title>
        <meta 
          name="description" 
          content="Professional home renovation services across Bergen, Passaic, Morris, Essex, and Hudson County. Kitchen remodels, bathroom upgrades, basement finishing, and more. Free estimates in all towns." 
        />
        <meta name="author" content="SmartReno" />
        <meta name="keywords" content="home renovation, kitchen remodel, bathroom renovation, Bergen County, Passaic County, Morris County, Essex County, Hudson County, North Jersey contractor" />
        <link rel="canonical" href="https://smartreno.io/locations" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Service Locations - Home Renovation Services in Northern NJ | SmartReno" />
        <meta property="og:description" content="Professional home renovation services across Bergen, Passaic, Morris, Essex, and Hudson County. Kitchen remodels, bathroom upgrades, basement finishing, and more." />
        <meta property="og:url" content="https://smartreno.io/locations" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SmartReno" />
        <meta name="twitter:title" content="Service Locations - Home Renovation Services in Northern NJ | SmartReno" />
        <meta name="twitter:description" content="Professional home renovation services across Bergen, Passaic, Morris, Essex, and Hudson County." />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-secondary/30 to-background border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6"
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Serving Northern New Jersey</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              >
                Professional Home Renovations Across Northern NJ
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
              >
                SmartReno serves homeowners in Bergen, Passaic, Morris, Essex, and Hudson counties with transparent pricing, vetted contractors, and expert project management.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button size="lg" asChild className="text-base">
                  <Link to="/homeowners#estimate-form">Get Free Estimate</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link to="/blog">Read Renovation Guides</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose SmartReno */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mb-12 text-center mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SmartReno for Your Renovation</h2>
              <p className="text-lg text-muted-foreground">
                We understand Northern New Jersey's unique building codes, permit requirements, and architectural styles.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { 
                  title: 'Local Code Expertise', 
                  desc: 'Navigate Bergen, Morris, Essex, Passaic, and Hudson County permit requirements with ease.',
                  icon: CheckCircle
                },
                { 
                  title: 'Vetted Local Contractors', 
                  desc: 'Work with licensed, insured contractors who specialize in North Jersey renovations.',
                  icon: CheckCircle
                },
                { 
                  title: 'Transparent Pricing', 
                  desc: 'Compare 3 competitive bids side-by-side with detailed line-item breakdowns.',
                  icon: CheckCircle
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <item.icon className="h-10 w-10 text-primary mb-3" />
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Counties We Serve */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Service Areas by County</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our comprehensive coverage across Northern New Jersey's premier counties
              </p>
            </motion.div>
            
            <div className="space-y-6">
              {counties.map((county, idx) => (
                <motion.div
                  key={county.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl md:text-3xl mb-3">
                            <Link 
                              to={`/locations/${county.slug}-county`} 
                              className="hover:text-primary transition-colors inline-flex items-center gap-2"
                            >
                              {county.name}
                              <ArrowRight className="h-5 w-5" />
                            </Link>
                          </CardTitle>
                          <p className="text-muted-foreground text-base">{county.description}</p>
                        </div>
                        <Button asChild variant="outline" size="lg" className="md:mt-0">
                          <Link to={`/locations/${county.slug}-county`}>
                            View All Towns
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Our Specialties:</h3>
                        <div className="flex flex-wrap gap-2">
                          {county.highlights.map((highlight, idx) => (
                            <span 
                              key={idx} 
                              className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-full hover:bg-primary/20 transition-colors"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          Towns We Serve ({county.towns.length} total):
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {county.towns.slice(0, 20).join(', ')}
                          {county.towns.length > 20 && ` and ${county.towns.length - 20} more`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* All Towns Directory - SEO-optimized */}
        <section className="py-16 bg-muted/30 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Complete Town Directory</h2>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Browse our complete service area across Northern New Jersey. Click any town name to find renovation guides, cost estimates, and permit information specific to your municipality.
            </p>
            <div className="grid md:grid-cols-5 gap-8">
              {counties.map(county => (
                <div key={county.slug}>
                  <h3 className="font-semibold mb-3 text-lg">{county.name}</h3>
                  <ul className="space-y-2 text-sm">
                    {county.towns.map((town) => (
                      <li key={town}>
                        <Link 
                          to={`/blog?search=${encodeURIComponent(town)}`}
                          className="text-muted-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {town}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Renovation?
              </h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Get a free on-site estimate and receive three competitive bids from vetted local contractors. No commitment required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-base">
                  <Link to="/homeowners#estimate-form">Request Free Estimate</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/">Learn More About SmartReno</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
