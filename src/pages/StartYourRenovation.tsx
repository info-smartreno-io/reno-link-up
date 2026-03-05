import React from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { IntakeSection } from "@/components/homepage/IntakeSection";

export default function StartYourRenovation() {
  const [searchParams] = useSearchParams();
  const projectType = searchParams.get("type") || "";
  const zip = searchParams.get("zip") || "";

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
            Fill out the form below and we'll match you with up to three vetted contractors in your area.
          </p>
        </div>
      </section>

      <IntakeSection />

      <FooterAdminLogin />
    </main>
  );
}
