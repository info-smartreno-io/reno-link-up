import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Palette, 
  TestTube, 
  Cloud, 
  Brain, 
  TrendingUp, 
  MessageCircle, 
  Handshake, 
  FileText, 
  Video, 
  Search, 
  Calculator, 
  DollarSign, 
  Users, 
  Scale,
  Building2,
  Package
} from "lucide-react";

interface TechnicalRole {
  title: string;
  summary: string;
  keywords: string[];
  icon: React.ReactNode;
}

const technicalRoles: TechnicalRole[] = [
  {
    title: "UI / UX Designer",
    summary: "Own the design system and user flows across homeowner, contractor, and Construction Agent portals. Ship Figma specs, prototypes, and conduct usability tests to reduce friction.",
    keywords: ["Figma", "Design Systems", "Prototyping", "User Research", "UI/UX"],
    icon: <Palette className="h-5 w-5" />,
  },
  {
    title: "QA Engineer",
    summary: "Design comprehensive test plans, build automated test suites, and catch regressions across web, mobile, and edge functions before they reach users.",
    keywords: ["Automated Testing", "QA", "Test Automation", "Selenium", "Cypress"],
    icon: <TestTube className="h-5 w-5" />,
  },
  {
    title: "DevOps / Cloud Engineer",
    summary: "Scale infrastructure and CI/CD pipelines with observability, performance tuning, secure backups, and deployments for a multi-tenant marketplace.",
    keywords: ["DevOps", "CI/CD", "Cloud Infrastructure", "Kubernetes", "Monitoring"],
    icon: <Cloud className="h-5 w-5" />,
  },
  {
    title: "AI / ML Engineer",
    summary: "Advance Smart Estimate capabilities—computer vision on site photos, scope extraction, anomaly detection, and intelligent contractor matching algorithms.",
    keywords: ["Machine Learning", "Computer Vision", "AI", "Python", "TensorFlow"],
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: "Head of Growth Marketing",
    summary: "Own acquisition funnels for homeowners and contractors. Drive CAC/LTV optimization, landing page testing, channel strategy, and referral loops.",
    keywords: ["Growth Marketing", "Performance Marketing", "Analytics", "A/B Testing", "Acquisition"],
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Community Manager",
    summary: "Grow and moderate homeowner & contractor communities across social platforms and forums. Turn conversations into qualified signups and brand advocates.",
    keywords: ["Community Building", "Social Media", "Engagement", "Content Moderation", "Brand Advocacy"],
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    title: "Partnership Manager",
    summary: "Source and manage strategic alliances with architects, interior designers, lenders, and material vendors to drive lead flow and value-added services.",
    keywords: ["Business Development", "Partnerships", "Negotiation", "Strategic Alliances", "Relationship Management"],
    icon: <Handshake className="h-5 w-5" />,
  },
  {
    title: "Content Creator / Copywriter",
    summary: "Ship blog posts, email sequences, landing page copy, and scripts that educate homeowners and position SmartReno as the renovation authority.",
    keywords: ["Content Writing", "Copywriting", "SEO Content", "Email Marketing", "Storytelling"],
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Video Editor / Producer",
    summary: "Create short-form video, testimonials, and process explainers that showcase transformations, build trust, and drive conversion.",
    keywords: ["Video Production", "Video Editing", "Adobe Premiere", "Final Cut Pro", "Content Creation"],
    icon: <Video className="h-5 w-5" />,
  },
  {
    title: "SEO / Performance Marketer",
    summary: "Own keyword strategy, technical SEO, and paid campaign optimization to capture high-intent traffic and reduce customer acquisition costs.",
    keywords: ["SEO", "Google Ads", "SEM", "Keyword Research", "Analytics"],
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Accountant",
    summary: "Manage AP/AR, job costing, payroll, and monthly financial closes with meticulous records and audit-ready books.",
    keywords: ["Accounting", "QuickBooks", "AP/AR", "Payroll", "Financial Reporting"],
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    title: "Finance Manager",
    summary: "Forecast cash flow, track unit economics, model scenarios, and support fundraising with metrics dashboards and board-ready reporting.",
    keywords: ["Financial Planning", "FP&A", "Forecasting", "Unit Economics", "Investor Relations"],
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "HR & Recruiting Lead",
    summary: "Run full-cycle recruiting, onboarding, culture programs, and maintain compliant HR policies and competitive compensation frameworks.",
    keywords: ["Recruiting", "HR", "Talent Acquisition", "Onboarding", "Compensation"],
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Legal & Compliance Officer",
    summary: "Oversee contracts, terms of service, privacy policies, licensing, insurance verification, and risk management across markets and vendors.",
    keywords: ["Legal", "Compliance", "Contract Management", "Risk Management", "Regulatory"],
    icon: <Scale className="h-5 w-5" />,
  },
  {
    title: "Head of Design Partnerships",
    summary: "Build a network of architects and interior designers. Package design services (plans, 3D renderings) as add-ons that accelerate project readiness.",
    keywords: ["Business Development", "Partnerships", "Architecture", "Design Services", "Sales"],
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Head of Vendor Partnerships",
    summary: "Secure preferred pricing and streamlined logistics with material suppliers, fixture vendors, and equipment partners to improve margins and timelines.",
    keywords: ["Vendor Management", "Supply Chain", "Procurement", "Negotiation", "Logistics"],
    icon: <Package className="h-5 w-5" />,
  },
];

export function CareersTechnicalSection() {
  const applyHref = (title: string) => {
    return `/careers/apply?role=${encodeURIComponent(title)}`;
  };

  return (
    <section id="technical" className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight">Technical & HQ Roles</h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            Build, scale, and optimize the SmartReno platform. Engineering, design, growth, and corporate functions—remote-friendly positions for builders and operators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicalRoles.map((role) => (
            <Card key={role.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0">
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{role.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {role.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {role.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto pt-2">
                  <Button asChild size="sm" className="w-full">
                    <a href={applyHref(role.title)} aria-label={`Apply for ${role.title}`}>
                      Apply
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
