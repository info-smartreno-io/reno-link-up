import React from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { AIChatBubble } from "@/components/website/AIChatBubble";
import { OptimizedImage } from "@/components/OptimizedImage";

import teamMethuseli from "@/assets/team-methuseli-zoomed.webp";
import teamBhavya from "@/assets/team-bhavya-updated.webp";

const team = [
  { name: "Methuseli Mfema", title: "Lead Engineer", image: teamMethuseli },
  { name: "Thomas Burns", title: "Founder & CEO", image: "" },
  { name: "Bhavyashree Putta", title: "Full Stack Developer", image: teamBhavya },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>About SmartReno - Built by Builders, Made for Trust</title>
        <meta 
          name="description" 
          content="Built by builders. Made for trust. SmartReno streamlines estimates, bidding, and milestone payments—so contractors can focus on the craft and homeowners can enjoy the outcome." 
        />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <section className="py-20 bg-muted/30 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About SmartReno</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by builders. Made for trust. SmartReno streamlines estimates, bidding, and milestone payments—so contractors can focus on the craft and homeowners can enjoy the outcome.
            </p>
          </div>
        </section>

        {/* Origin Story */}
        <section className="py-16 container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-semibold mb-6">Our Story</h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              <strong>SmartReno was founded by Thomas Burns</strong>, a third-generation builder from a family that owned and operated a mechanical outfit in NJ and NYC. At the start of the pandemic, Thomas moved into residential construction, driven by a passion for building spaces that genuinely improve everyday life.
            </p>
            <p>
              Working hands-on with general contractors—then running his own firm—he saw the same pain points over and over: the admin grind, unpredictable lead flow, quoting under pressure, juggling multiple projects with limited labor, chasing materials, maintaining quality, collecting payments, and worrying about the next job. In a saturated market, even small miscommunications can cost thousands for both contractors and homeowners.
            </p>
            <p>
              <strong>SmartReno is the answer to that reality</strong>—a platform built from first-hand experience. We streamline operations for contractors so they can focus on what matters most: delivering exceptional work for the homeowners who trust them. And we give homeowners clarity, communication, and confidence from day one.
            </p>
            <p>
              We believe building a great home starts with a <strong>square, level foundation</strong>. SmartReno brings that same principle to the beginning of every project—so both contractors and homeowners end satisfied at the end.
            </p>
          </div>
        </section>

        {/* Pull Quote */}
        <section className="bg-primary/5 py-12 text-center">
          <blockquote className="text-2xl italic font-medium text-primary max-w-3xl mx-auto px-6">
            "We start every project square and level—so it ends exactly how it should."
          </blockquote>
        </section>

        {/* Mission Section */}
        <section className="py-16 container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            To simplify residential renovation by uniting homeowners, estimators, and verified contractors in one transparent,
            milestone-driven platform—so projects start square and finish strong.
          </p>
        </section>

        <Separator className="my-12" />

        {/* Team Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">Our Team</h2>
            <div className="flex justify-center">
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 max-w-4xl">
                {team.map((member, index) => (
                  <Card
                    key={index}
                    className="rounded-xl overflow-visible shadow-sm hover:scale-[1.02] transition-transform border-0 bg-transparent"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-48 h-48 rounded-full overflow-hidden bg-muted mb-4 ring-4 ring-background shadow-lg">
                        {member.image ? (
                          <OptimizedImage
                            src={member.image}
                            alt={`${member.name} - ${member.title}`}
                            width={400}
                            height={400}
                            className={`object-cover w-full h-full ${member.name === "Bhavyashree Putta" ? "object-[center_30%]" : ""}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <p className="text-muted-foreground text-sm">{member.title}</p>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
              </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">Follow Our Journey</h2>
            <p className="text-muted-foreground mb-8">
              Get your estimate, join the contractor network, or explore insights from our team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link to="/get-estimate">Get Your Estimate</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/professionals/auth">Join the Network</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/blog">Read Our Blog</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      
      <AIChatBubble />
    </>
  );
}

