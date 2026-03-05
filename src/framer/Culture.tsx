import React from "react";
import { Card } from "@/components/ui/card";

type Item = { title: string; description: string };
export default function Culture({ items, title }: { items: Item[]; title: string }) {
  return (
    <section className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl font-bold text-foreground mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {items.map((v, i) => (
            <Card key={`val-${i}`} className="p-4">
              <div className="font-bold text-foreground mb-2">{v.title}</div>
              <div className="text-sm text-muted-foreground">{v.description}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
