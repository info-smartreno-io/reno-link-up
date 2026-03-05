import React from "react";
import { Button } from "@/components/ui/button";

type Props = { headline: string; subhead: string; ctaHref?: string };

export default function Hero({ headline, subhead, ctaHref }: Props) {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">{headline}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{subhead}</p>
        {ctaHref && (
          <Button asChild className="mt-6">
            <a href={ctaHref}>Explore Our Mission</a>
          </Button>
        )}
      </div>
    </section>
  );
}
