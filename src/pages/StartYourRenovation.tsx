import React from "react";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { ProjectIntakeWizard } from "@/components/intake/ProjectIntakeWizard";

export default function StartYourRenovation() {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Start Your Renovation – SmartReno | Northern NJ</title>
        <meta name="description" content="Tell us about your renovation project and get matched with vetted local contractors in Northern New Jersey." />
        <link rel="canonical" href="https://smartreno.io/start-your-renovation" />
      </Helmet>

      <SiteNavbar />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Start Your Renovation Project
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Answer a few questions and we'll match you with vetted contractors and clear pricing options.
          </p>
        </div>
      </section>

      <ProjectIntakeWizard />

      <FooterAdminLogin />
    </main>
  );
}
