import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getProjectTypeBySlug } from "@/data/projectTypes";
import { trackEvent } from "@/utils/analytics";

// Import all project images
import kitchenImage from "@/assets/projects/kitchen-remodel.jpg";
import bathroomImage from "@/assets/projects/bathroom-remodel.jpg";
import flooringImage from "@/assets/projects/flooring.jpg";
import paintingImage from "@/assets/projects/painting.jpg";
import trimCarpentryImage from "@/assets/projects/trim-carpentry.jpg";
import staircaseImage from "@/assets/projects/staircase.jpg";
import basementImage from "@/assets/projects/basement-finishing.jpg";
import atticImage from "@/assets/projects/attic-conversion.jpg";
import roofingImage from "@/assets/projects/roofing.jpg";
import sidingImage from "@/assets/projects/siding.jpg";
import windowsImage from "@/assets/projects/windows.jpg";
import doorsImage from "@/assets/projects/doors.jpg";
import masonryImage from "@/assets/projects/masonry.jpg";
import extensionImage from "@/assets/projects/home-extension.jpg";
import addALevelImage from "@/assets/projects/add-a-level.jpg";
import dormersImage from "@/assets/projects/dormers.jpg";
import garageImage from "@/assets/projects/garage-build.jpg";

const projectImages: Record<string, string> = {
  'kitchen': kitchenImage,
  'bathroom': bathroomImage,
  'flooring': flooringImage,
  'painting': paintingImage,
  'trim-carpentry': trimCarpentryImage,
  'staircase': staircaseImage,
  'basement': basementImage,
  'attic': atticImage,
  'roofing': roofingImage,
  'siding': sidingImage,
  'windows': windowsImage,
  'doors': doorsImage,
  'masonry': masonryImage,
  'home-extension': extensionImage,
  'add-a-level': addALevelImage,
  'dormers': dormersImage,
  'garage-builds': garageImage,
  'deck-coverings': extensionImage,
  'seasons-rooms': extensionImage
};

export default function ProjectTypePage() {
  const { projectType = "" } = useParams();
  const project = getProjectTypeBySlug(projectType);

  if (!project) {
    return (
      <>
        <SiteNavbar />
        <main className="container mx-auto px-4 py-10 min-h-screen">
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Project Type Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find information for this project type.
            </p>
            <Button asChild>
              <Link to="/">Return Home</Link>
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
        <title>{project.metaTitle}</title>
        <meta name="description" content={project.metaDescription} />
        <meta name="keywords" content={project.keywords.join(', ')} />
        <meta name="author" content="SmartReno" />
        <link rel="canonical" href={`https://smartreno.io/projects/${project.slug}`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={project.metaTitle} />
        <meta property="og:description" content={project.metaDescription} />
        <meta property="og:url" content={`https://smartreno.io/projects/${project.slug}`} />
        <meta property="og:image" content={`https://smartreno.io${projectImages[project.slug]}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SmartReno" />
        <meta name="twitter:title" content={project.metaTitle} />
        <meta name="twitter:description" content={project.metaDescription} />
        <meta name="twitter:image" content={`https://smartreno.io${projectImages[project.slug]}`} />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section with Image */}
        <section className="relative py-0">
          {/* Hero Image */}
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            <img 
              src={projectImages[project.slug]} 
              alt={`${project.name} - Professional renovation services in North Jersey`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            
            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-4">
                  {project.category === 'interior' && 'Interior Renovation'}
                  {project.category === 'exterior' && 'Exterior Renovation'}
                  {project.category === 'additions' && 'Home Addition'}
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
                  {project.h1}
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed mb-8 drop-shadow-md max-w-2xl">
                  {project.intro}
                </p>

                <Button 
                  size="lg" 
                  asChild
                  onClick={() => trackEvent('project_type_cta_click', {
                    project_type: project.slug,
                    cta_location: 'hero'
                  })}
                >
                  <Link to="/get-estimate" className="inline-flex items-center gap-2">
                    Get Free Estimate <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              {project.description.map((paragraph, index) => (
                <p key={index} className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Key Benefits</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {project.benefits.map((benefit, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{benefit}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Our Process</h2>
            <div className="space-y-4">
              {project.process.map((step, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-foreground pt-1">{step}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Considerations */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Important Considerations</h2>
            <div className="space-y-3">
              {project.considerations.map((consideration, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-muted-foreground">{consideration}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Start Your {project.name} Project?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get a free estimate from vetted contractors in your area. No obligation, transparent pricing, expert guidance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                onClick={() => trackEvent('project_type_cta_click', {
                  project_type: project.slug,
                  cta_location: 'bottom'
                })}
              >
                <Link to="/get-estimate">
                  Get Free Estimate
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/locations">
                  View Service Areas
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Related Projects */}
        <section className="py-12 border-t">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold mb-4">Related Services</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link to="/projects">
                  All Services
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
