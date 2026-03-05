import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ClipboardList, Ruler, Camera, Users, Mail } from "lucide-react";

export type Opening = {
  group: string;
  summary?: string;
  icon?: React.ReactNode;
  roles: Array<{
    title: string;
    keywords?: string[];
  }>;
};

const openingsConfig: Opening[] = [
  {
    group: "Estimators",
    summary:
      "Visit homes, scope projects, capture measurements and photos, and prepare transparent digital estimates that power our 3‑bid proposals.",
    icon: <ClipboardList className="h-5 w-5" aria-hidden />,
    roles: [
      { title: "Estimator — Exterior Trades", keywords: ["Roofing", "Siding", "Windows", "Masonry"] },
      { title: "Estimator — Interior Trades", keywords: ["Flooring", "Painting", "Custom Carpentry"] },
      { title: "Estimator — Kitchen & Bathroom" },
      { title: "Estimator — Basements & Attics" },
      { title: "Estimator — Additions / Major Renovations" },
      { title: "Estimator — Mechanicals", keywords: ["Plumbing", "Electrical", "HVAC", "Solar"] },
    ],
  },
  {
    group: "Trade Specialists",
    summary:
      "Hands‑on specialists who partner with estimators and project coordinators to deliver quality craftsmanship and predictable schedules.",
    icon: <Users className="h-5 w-5" aria-hidden />,
    roles: [
      { title: "Trade Specialist — Exterior (Roofing / Siding / Windows / Masonry)" },
      { title: "Trade Specialist — Interior (Flooring / Painting / Custom Carpentry)" },
      { title: "Trade Specialist — Kitchen & Bathroom" },
      { title: "Trade Specialist — Basements & Attics" },
      { title: "Trade Specialist — Additions / Major Renovations" },
      { title: "Trade Specialist — Mechanicals (Plumbing / Electrical / HVAC / Solar)" },
    ],
  },
];

function TitleRow({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    </div>
  );
}

function KeywordBadges({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="common keywords">
      {items.map((k) => (
        <Badge key={k} variant="secondary" className="text-xs">
          {k}
        </Badge>
      ))}
    </div>
  );
}

export function CareersEstimatorsSection() {
  const buildApplyHref = (role: string) => {
    return `/careers/apply?role=${encodeURIComponent(role)}`;
  };

  return (
    <section id="estimators" className="py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Estimators & Trade Specialists</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Help homeowners scope projects with clarity and connect them to trusted contractors. We value
                craftsmanship, transparency, and modern tools.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {openingsConfig.map((group) => (
            <Card key={group.group} className="border-muted/50">
              <CardHeader className="pb-3">
                <TitleRow icon={group.icon} title={group.group} />
                {group.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground">{group.summary}</p>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {group.roles.map((r) => (
                    <li key={r.title} className="group rounded-xl border border-transparent p-2 hover:border-muted/60">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="font-medium leading-tight">{r.title}</div>
                          <KeywordBadges items={r.keywords} />
                        </div>
                        <div className="shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            asChild
                            className="group/btn"
                            data-analytics="careers-apply-click"
                            data-role={r.title}
                          >
                            <a href={buildApplyHref(r.title)} aria-label={`Apply for ${r.title}`}>
                              Apply <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Role expectations (shared, optional) */}
                <div className="mt-6 rounded-lg bg-muted/30 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <Ruler className="h-4 w-4" aria-hidden /> What You'll Do
                  </h4>
                  <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Perform on‑site assessments and capture accurate measurements.</li>
                    <li>Upload project photos and notes through the SmartReno Estimator App.</li>
                    <li>Collaborate with coordinators and contractors to produce 3‑bid proposals.</li>
                    <li>Communicate timelines, scope, and expectations clearly with homeowners.</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-lg bg-muted/30 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <Camera className="h-4 w-4" aria-hidden /> Who You Are
                  </h4>
                  <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Experienced in residential construction or a specific trade.</li>
                    <li>Organized, detail‑oriented, and comfortable with mobile tools.</li>
                    <li>Strong communicator with homeowners and field teams.</li>
                    <li>Licensed or certified where required (preferred).</li>
                  </ul>
                </div>

                {/* Alt apply block */}
                <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" aria-hidden />
                  Prefer email? Send your resume to
                  <a className="ml-1 font-medium underline" href="mailto:careers@smartreno.io">careers@smartreno.io</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
