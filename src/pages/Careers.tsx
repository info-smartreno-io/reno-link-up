import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteNavbar } from "@/components/SiteNavbar";
import { CareersEstimatorsSection } from "@/components/CareersEstimatorsSection";
import { CareersOperationsSection } from "@/components/CareersOperationsSection";
import { CareersTechnicalSection } from "@/components/CareersTechnicalSection";

const culturePoints = [
  { title: "Care deeply about people", description: "Every interaction matters—homeowners, contractors, and teammates." },
  { title: "Own the outcome", description: "Take responsibility from start to finish and deliver results." },
  { title: "Clear is kind", description: "Communicate openly, honestly, and with empathy." },
  { title: "Raise the bar on craft", description: "Excellence in every detail, from estimates to code." },
  { title: "Move fast, measure, improve", description: "Ship quickly, learn continuously, iterate relentlessly." },
];

export default function Careers() {
  return (
    <>
      <Helmet>
        <title>Careers — Join SmartReno | Operations, Estimators, Engineering & Growth Roles</title>
        <meta 
          name="description" 
          content="Join SmartReno's team of project coordinators, estimators, engineers, and growth professionals. We're hiring across operations, construction trades, and HQ roles in Northern NJ and remote." 
        />
      </Helmet>

      <main className="min-h-screen bg-background">
        <SiteNavbar />

        {/* Hero */}
        <section className="py-14 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Build the future of renovations
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              SmartReno blends construction expertise with modern technology to create transparency, trust, and better outcomes for homeowners and contractors.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button size="lg" asChild>
                <a href="#operations">View operations roles</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#technical">Explore HQ & tech roles</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Operations Roles — TOP PRIORITY */}
        <CareersOperationsSection />

        {/* Estimators & Trade Specialists */}
        <CareersEstimatorsSection />

        {/* Technical & HQ Roles */}
        <CareersTechnicalSection />

        {/* Culture */}
        <section className="py-14 bg-muted/30 border-y">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">How We Work</h2>
              <p className="mt-2 text-muted-foreground">Our values guide every decision and interaction.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {culturePoints.map((point, i) => (
                <Card key={i} className="text-center">
                  <CardHeader>
                    <CardTitle className="text-lg">{point.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* EEO */}
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Equal Opportunity Employer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  SmartReno is committed to building a diverse, inclusive team. We do not discriminate on the basis of race, religion, color, national origin, gender, sexual orientation, age, marital status, veteran status, or disability.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 border-t">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-4 text-sm">
            <div>
              <div className="font-semibold">SmartReno</div>
              <p className="mt-2 text-muted-foreground">Renovations, simplified.</p>
            </div>
            <div>
              <div className="font-semibold">Explore</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="/">Home</a></li>
                <li><a className="hover:underline" href="/blog">Blog</a></li>
                <li><a className="hover:underline" href="/about">About</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Company</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="/careers">Careers</a></li>
                <li><a className="hover:underline" href="#operations">Operations Jobs</a></li>
                <li><a className="hover:underline" href="#technical">Tech & HQ Jobs</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Contact</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="underline" href="mailto:careers@smartreno.io">careers@smartreno.io</a></li>
                <li>(201) 788-9502</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SmartReno. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  );
}
