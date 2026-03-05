import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { allServices } from "@/data/serviceData";
import { ArrowRight, Shield } from "lucide-react";

export default function ServicesIndex() {
  return (
    <>
      <Helmet>
        <title>Home Services | Drain Cleaning, Gutter Cleaning, Handyman | All In One Home Solutions</title>
        <meta name="description" content="Professional drain cleaning, gutter cleaning, and handyman services in Northern NJ. Licensed & insured." />
      </Helmet>
      <SiteNavbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Home Services</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Professional home services you can trust. Quality work from licensed & insured professionals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" /> Licensed & Insured</div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {allServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl">{service.name}</CardTitle>
                    <CardDescription>{service.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{service.description}</p>
                    <ul className="space-y-1">
                      {service.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full">
                      <Link to={`/services/${service.slug}`}>
                        View Pricing <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
