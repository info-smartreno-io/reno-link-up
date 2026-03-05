import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, FileCheck, ShieldCheck, MapPin, Headphones } from "lucide-react";

interface OperationsRole {
  title: string;
  summary: string;
  keywords: string[];
  icon: React.ReactNode;
}

const operationsRoles: OperationsRole[] = [
  {
    title: "Project Coordinator",
    summary: "Schedule walkthroughs, track milestones, and coordinate between homeowners, estimators, and contractors to ensure seamless handoffs and on-time project delivery.",
    keywords: ["Project Management", "Scheduling", "Coordination", "Client Communication", "Milestone Tracking"],
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Client Success Manager",
    summary: "Be the homeowner's advocate—manage expectations, provide updates, resolve concerns, and drive 5★ satisfaction and referrals throughout the renovation journey.",
    keywords: ["Customer Service", "Client Relations", "Communication", "Problem Solving", "Retention"],
    icon: <Headphones className="h-5 w-5" />,
  },
  {
    title: "Permitting & Compliance Manager",
    summary: "Prepare and submit municipal permit applications, track approvals, and ensure all projects comply with local building codes, licensing, and insurance requirements.",
    keywords: ["Building Permits", "Compliance", "Regulations", "Municipal Codes", "Documentation"],
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    title: "Warranty & Quality Control Rep",
    summary: "Conduct on-site inspections, verify specification compliance, document punch lists, and coordinate warranty claims to maintain SmartReno's quality standards.",
    keywords: ["Quality Assurance", "Inspections", "Construction Standards", "Warranty Management", "Documentation"],
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Regional Pod Manager / Director",
    summary: "Run a local SmartReno hub—manage staffing, optimize throughput, track KPIs, and cultivate contractor/vendor relationships across 1–2 geographic pods.",
    keywords: ["Operations Management", "Team Leadership", "KPI Tracking", "Vendor Relations", "Process Optimization"],
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Estimator Team Lead",
    summary: "Coach a squad of estimators, review scopes for accuracy and completeness, improve bid conversion rates, and standardize processes through training and mentorship.",
    keywords: ["Team Leadership", "Training", "Quality Control", "Process Improvement", "Construction Estimating"],
    icon: <Users className="h-5 w-5" />,
  },
];

export function CareersOperationsSection() {
  const applyHref = (title: string) => {
    return `/careers/apply?role=${encodeURIComponent(title)}`;
  };

  return (
    <section id="operations" className="py-14 bg-muted/30 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight">Operations Roles</h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            Field-driven, client-facing positions that connect homeowners, estimators, and contractors. 
            Build relationships, coordinate projects, and ensure quality outcomes across Northern NJ.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {operationsRoles.map((role) => (
            <Card key={role.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {role.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto pt-2">
                  <Button asChild className="w-full">
                    <a href={applyHref(role.title)} aria-label={`Apply for ${role.title}`}>
                      Apply Now
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
