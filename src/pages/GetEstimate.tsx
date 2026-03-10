import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Clock, Shield, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { EstimateForm } from "@/components/EstimateForm";
import { Helmet } from "react-helmet-async";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { AIChatBubble } from "@/components/website/AIChatBubble";

export default function GetEstimate() {
  return (
    <>
      <Helmet>
        <title>Get Free Estimate - SmartReno | Northern NJ Renovations</title>
        <meta name="description" content="Get a free, no-obligation estimate for your home renovation project. Book a 60-minute site visit and receive verified scope with three competitive bids from vetted contractors." />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              100% Free • No Obligation • Vetted Contractors
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Get Your Free Renovation Estimate
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Book a 60-minute site visit. Get a verified scope and three competitive bids from pre-vetted contractors.
            </p>
          </div>

          {/* Form - Centered and Prioritized */}
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="shadow-2xl border-2">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">Request Your Free Estimate</CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EstimateForm />
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section - Below Form */}
          <div className="space-y-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  What to Expect
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Fill Out the Form</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your project, timeline, and budget. Takes less than 2 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Schedule Your Visit</h3>
                    <p className="text-sm text-muted-foreground">
                      Our Construction Agent will visit your home for a detailed assessment (60 minutes).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Receive Your Bids</h3>
                    <p className="text-sm text-muted-foreground">
                      Get 3 competitive bids from pre-screened, licensed contractors in your area.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Start Your Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your contractor and begin your renovation with confidence.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Award className="h-5 w-5 text-primary" />
                  Why Choose SmartReno?
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All contractors are licensed, insured, and background-checked</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Transparent pricing with detailed scopes of work</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Project management platform included at no extra cost</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Milestone payment protection for your peace of mind</span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Local experts serving Bergen, Passaic, Morris, Essex & Hudson counties</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Signals */}
          <div className="bg-muted/50 rounded-2xl p-8 border mb-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Trusted by Northern NJ Homeowners</h2>
            </div>
          </div>

          {/* Service Areas */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Serving Northern New Jersey</h3>
            <p className="text-muted-foreground mb-6">
              Bergen County • Passaic County • Morris County • Essex County • Hudson County
            </p>
            <Button variant="outline" asChild>
              <Link to="/locations">View All Service Areas</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
      
      <AIChatBubble />
    </>
  );
}
