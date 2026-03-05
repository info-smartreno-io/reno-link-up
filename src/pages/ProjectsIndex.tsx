import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { projectTypes } from "@/data/projectTypes";
import { motion } from "framer-motion";

export default function ProjectsIndex() {
  const interiorProjects = projectTypes.filter(p => p.category === 'interior');
  const exteriorProjects = projectTypes.filter(p => p.category === 'exterior');
  const additionsProjects = projectTypes.filter(p => p.category === 'additions');

  return (
    <>
      <Helmet>
        <title>Home Renovation Services | SmartReno</title>
        <meta name="description" content="Professional home renovation services in North Jersey. Kitchen, bathroom, basement, additions & more. Get free estimates from vetted contractors." />
        <meta name="author" content="SmartReno" />
        <link rel="canonical" href="https://smartreno.io/projects" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Home Renovation Services | SmartReno" />
        <meta property="og:description" content="Professional home renovation services in North Jersey. Kitchen, bathroom, basement, additions & more." />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SmartReno" />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Home Renovation Services
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                From kitchens and bathrooms to additions and exterior work, SmartReno connects you with vetted contractors for every home improvement project.
              </p>
              <Button size="lg" asChild>
                <Link to="/get-estimate" className="inline-flex items-center gap-2">
                  Get Free Estimate <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Interior Renovations */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Interior Renovations</h2>
              <p className="text-lg text-muted-foreground">Transform your home's interior spaces</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interiorProjects.map((project, index) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{project.name}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.intro}
                      </p>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link to={`/projects/${project.slug}`}>
                          Learn More →
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Exterior Renovations */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Exterior Renovations</h2>
              <p className="text-lg text-muted-foreground">Enhance your home's curb appeal and protection</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exteriorProjects.map((project, index) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{project.name}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.intro}
                      </p>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link to={`/projects/${project.slug}`}>
                          Learn More →
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Additions */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Home Additions</h2>
              <p className="text-lg text-muted-foreground">Expand your living space</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionsProjects.map((project, index) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{project.name}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.intro}
                      </p>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link to={`/projects/${project.slug}`}>
                          Learn More →
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Get free estimates from vetted contractors in your area. No obligation, transparent pricing.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/get-estimate">
                  Get Free Estimate
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/locations">
                  View Service Areas
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
