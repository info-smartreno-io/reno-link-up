import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const products = [
  { name: "Trex Decking", description: "Composite decking" },
  { name: "Andersen Windows", description: "Windows & doors" },
  { name: "Marvin Windows", description: "Premium windows" },
  { name: "Cambridge Pavers", description: "Hardscape/pavers" },
  { name: "Fabuwood Cabinets", description: "Kitchen cabinetry" },
  { name: "Shiloh Cabinets", description: "Semi-custom cabinets" },
  { name: "MSI Surfaces", description: "Quartz, tile, stone" },
  { name: "Kuiken Brothers", description: "Trim, doors, lumber" },
  { name: "Braen Stone", description: "Stone & aggregates" },
  { name: "Kohler", description: "Plumbing fixtures" },
  { name: "Delta", description: "Faucets & fixtures" },
  { name: "Local HVAC Suppliers", description: "Heating & cooling" },
  { name: "GPS Plumbing Supply", description: "Plumbing supply" },
  { name: "Home Depot", description: "Building materials" },
  { name: "Lowe's", description: "Building materials" }
];

export function ProductCarousel() {
  return (
    <section className="py-16 md:py-20 bg-muted/20 border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted products & brands for your renovation
          </h2>
          <p className="text-lg text-muted-foreground">
            From decking and windows to cabinets and stone, SmartReno contractors work with trusted national brands and local suppliers.
          </p>
        </div>

        {/* Carousel - using CSS scroll snap */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {products.map((product, index) => (
              <Card key={index} className="flex-shrink-0 w-72 snap-start">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          *Your SmartReno estimator can help you choose the best product options for your style, budget, and timeline.
        </p>
      </div>
    </section>
  );
}
