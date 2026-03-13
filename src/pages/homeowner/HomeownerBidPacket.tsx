import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useHomeownerProjects, useHomeownerBidPacket, useHomeownerProposals } from "@/hooks/useHomeownerData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft, ArrowRight, MapPin, Send, Image, Video, LayoutTemplate, ScrollText } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IntakeStatusCard } from "@/components/homeowner/IntakeStatusCard";

export default function HomeownerBidPacket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: projects, isLoading } = useHomeownerProjects();
  const activeProject = projects?.[0] || null;
  const { data: intakeProject } = useQuery({
    queryKey: ["homeowner-intake-bidpacket-fallback"],
    enabled: !isLoading && !activeProject,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, project_type, created_at, status, city, zip_code, photos")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[HomeownerBidPacket] intake fallback error", error);
        return null;
      }

      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["homeowner-profile-timeline"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("project_timeline")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("[HomeownerBidPacket] profile timeline error", error);
        return null;
      }
      return data;
    },
  });
  const { data: bidPacketData, isLoading: bidLoading } = useHomeownerBidPacket(
    activeProject?.id
  );
  const { data: proposals } = useHomeownerProposals(activeProject?.id);
  const [isRequestingBids, setIsRequestingBids] = useState(false);

  const intakeProjectType = ((intakeProject as any)?.project_type || "").toLowerCase();
  const materialSelections: { category: string; description: string; notes: string }[] =
    intakeProjectType.includes("kitchen")
      ? [
          {
            category: "Cabinetry",
            description: "Base and wall cabinets, panels, and trim.",
            notes: "Include soft-close hardware, toe kicks, and finished end panels where visible.",
          },
          {
            category: "Counters & backsplash",
            description: "Countertops and wall tile at splash.",
            notes: "Price primary material with an allowance for upgrades; include templating and installation.",
          },
          {
            category: "Flooring",
            description: "Finished flooring in the renovation area.",
            notes: "Include underlayment, transitions, and any required floor prep.",
          },
          {
            category: "Plumbing & electrical fixtures",
            description: "Sinks, faucets, pendants, and recessed lighting package.",
            notes: "Assume homeowner final selections from agreed fixture schedule.",
          },
        ]
      : intakeProjectType.includes("bath")
      ? [
          {
            category: "Tile",
            description: "Floor and shower wall tile, trims, and shower pan.",
            notes: "Include waterproofing, niches, and any decorative bands if shown on plans.",
          },
          {
            category: "Vanity & top",
            description: "Vanity cabinet, countertop, and sink.",
            notes: "Assume standard sizes per layout; hardware and mirror as specified.",
          },
          {
            category: "Plumbing fixtures",
            description: "Shower valve/trim, tub filler (if applicable), lav faucet, and toilet.",
            notes: "Match brand/series specified by estimator; include rough-in and trim.",
          },
          {
            category: "Glass & accessories",
            description: "Shower glass, towel bars, hooks, and accessories.",
            notes: "Include standard clear tempered glass and hardware finishes to match fixtures.",
          },
        ]
      : [
          {
            category: "Finishes",
            description: "Flooring, paint, and wall/ceiling finishes in the renovation area.",
            notes: "Include prep, primer, and two finish coats unless noted otherwise.",
          },
          {
            category: "Fixtures & hardware",
            description: "Lighting, plumbing, and door hardware within the scope.",
            notes: "Assume a coordinated package based on the final selections schedule.",
          },
          {
            category: "Built-ins & millwork",
            description: "Custom built-ins, trim, and specialty carpentry called out in scope.",
            notes: "Include priming/painting or staining to match design intent.",
          },
        ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/homeowner/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>

        <div className="flex flex-wrap gap-2 text-xs">
          <Button variant="outline" size="sm" onClick={() => scrollToSection("bp-overview")}>
            Overview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/project-inclusions")}
          >
            Inclusions & exclusions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/project-materials")}
          >
            Materials & selections
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/project-files-visuals")}
          >
            Files & visuals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/project-scope")}
          >
            Scope & line items
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/project-timeline-preview")}
          >
            Timeline
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/homeowner/projects/preview/compare-bids")}
          >
            Compare bids
          </Button>
        </div>

        <Card id="bp-overview">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bid packet preview
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Project type</p>
                <p className="font-medium text-foreground">
                  {(intakeProject as any)?.project_type || "Renovation project"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-foreground">
                  {(intakeProject as any)?.created_at
                    ? format(new Date((intakeProject as any).created_at), "MMM d, yyyy h:mm a")
                    : "Pending"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-foreground">
                  {[
                    (intakeProject as any)?.city,
                    (intakeProject as any)?.zip_code,
                  ]
                    .filter(Boolean)
                    .join(" ") || "To be confirmed"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Projected start date</p>
                <p className="text-foreground">
                  {(profile as any)?.project_timeline || "We&apos;ll confirm your ideal start window during estimating."}
                </p>
              </div>
            </div>

            <div className="space-y-1" id="bp-files">
              <p className="text-xs text-muted-foreground">Scope summary (for contractors)</p>
              <p className="text-sm text-foreground whitespace-pre-line">
                This is where we&apos;ll summarize the rooms, phases, and big-picture scope for your
                renovation in language that contractors can price from. Your SmartReno estimator will
                fill this in based on your intake answers, photos, and a site visit if needed.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Inclusions & exclusions (contractor-facing)
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-muted/60">
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-32">
                        Section
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-40">
                        Examples / notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-2 py-1 align-top font-medium text-foreground">
                        Inclusions
                      </td>
                      <td className="px-2 py-1 align-top text-muted-foreground">
                        Labor, materials, permits, and cleanup that are expected to be part of the bids.
                      </td>
                      <td className="px-2 py-1 align-top text-muted-foreground">
                        Demo, framing, finishes, typical site protection, haul-away, and standard permit
                        fees (unless noted otherwise).
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 align-top font-medium text-foreground">
                        Exclusions
                      </td>
                      <td className="px-2 py-1 align-top text-muted-foreground">
                        Items that are specifically not covered so there are no surprises.
                      </td>
                      <td className="px-2 py-1 align-top text-muted-foreground">
                        Major structural changes, utility upgrades, hazardous material abatement, or
                        owner-supplied items unless clearly called out.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Materials & selections (auto-filled from your scope)
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-muted/60">
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-32">
                        Category
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-40">
                        Examples / notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialSelections.map((row, idx) => (
                      <tr key={idx} className={idx < materialSelections.length - 1 ? "border-b" : ""}>
                        <td className="px-2 py-1 align-top font-medium text-foreground">
                          {row.category}
                        </td>
                        <td className="px-2 py-1 align-top text-muted-foreground">
                          {row.description}
                        </td>
                        <td className="px-2 py-1 align-top text-muted-foreground">
                          {row.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This table pre-fills based on the scope of work you selected (for example, kitchen vs.
                bath vs. whole-home), and your estimator will fine-tune the exact material schedule
                before bids go out.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Files & visuals</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/homeowner/project-photos")}
                >
                  <Image className="h-3.5 w-3.5" />
                  Photos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/homeowner/project-videos")}
                >
                  <Video className="h-3.5 w-3.5" />
                  Videos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/homeowner/project-plans")}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  3D & Plans
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/homeowner/project-survey")}
                >
                  <ScrollText className="h-3.5 w-3.5" />
                  Survey
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                As your design and estimating progresses, photos, videos, architectural plans, and any
                survey documents will appear on these dedicated pages for this project.
              </p>
            </div>

            <div className="space-y-1" id="bp-scope">
              <p className="text-xs font-medium text-muted-foreground">Line-item scope preview (no pricing)</p>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-10">
                        Item
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-32">
                        Trade
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                        Description of work
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-24">
                        Cost code
                      </th>
                      <th className="px-2 py-1 text-right font-medium text-muted-foreground w-16">
                        Qty
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground w-16">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        no: 1,
                        trade: "Demolition",
                        desc: "Selective demo of existing finishes, fixtures, and non-structural elements in work area.",
                        code: "01-DEM-100",
                      },
                      {
                        no: 2,
                        trade: "Framing / Carpentry",
                        desc: "Framing adjustments, blocking, and backing required to support new layout and finishes.",
                        code: "02-FRM-200",
                      },
                      {
                        no: 3,
                        trade: "Mechanical / Electrical / Plumbing",
                        desc: "Rough-in adjustments to power, lighting, switches, and plumbing within the scope area.",
                        code: "03-MEP-300",
                      },
                      {
                        no: 4,
                        trade: "Finishes",
                        desc: "Drywall, trim, paint, flooring, and other finish work per selections.",
                        code: "04-FIN-400",
                      },
                      {
                        no: 5,
                        trade: "Permits & Fees",
                        desc: "Allowances for required building permits and inspections, if applicable.",
                        code: "05-PRM-500",
                      },
                    ].map((row) => (
                      <tr key={row.no} className="border-b last:border-0">
                        <td className="px-2 py-1 align-top text-muted-foreground">{row.no}</td>
                        <td className="px-2 py-1 align-top text-foreground whitespace-nowrap">
                          {row.trade}
                        </td>
                        <td className="px-2 py-1 align-top text-foreground">
                          {row.desc}
                        </td>
                        <td className="px-2 py-1 align-top text-muted-foreground whitespace-nowrap">
                          {row.code}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-muted-foreground">—</td>
                        <td className="px-2 py-1 align-top text-muted-foreground">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your finalized bid packet will break the project into clear line items like this so every
                contractor is pricing the same work. Dollars will be shown only on contractor and admin
                views, not in this homeowner summary.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Site & general conditions</p>
              <p className="text-xs text-muted-foreground">
                Access, parking, staging, protection requirements, and other on-site conditions from your
                SmartReno field visit will be summarized here so contractors know what to account for.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Permits & approvals</p>
              <p className="text-xs text-muted-foreground">
                This section will outline which party is responsible for permits and inspections, and any
                special approvals needed for your town or HOA.
              </p>
            </div>

            <div className="space-y-2" id="bp-timeline">
              <p className="text-xs font-medium text-muted-foreground">Projected timeline</p>
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                {[
                  {
                    phase: "Discovery, estimating & bid packet",
                    window: "1–4 weeks",
                    note: "Confirm scope, gather photos, run estimating, and finalize this bid packet.",
                    width: "w-1/4",
                  },
                  {
                    phase: "Architectural design (if needed)",
                    window: "1–3+ months",
                    note: "Optional design/architecture phase for additions, structural moves, or major layout changes.",
                    width: "w-1/3",
                  },
                  {
                    phase: "Bid / contractor selection",
                    window: "1–2 weeks",
                    note: "Contractors review the packet and submit proposals so you can compare options.",
                    width: "w-1/5",
                  },
                  {
                    phase: "Permits & pre-construction",
                    window: "1–2 weeks",
                    note: "Submit permits (where required), order materials, and lock in the start date.",
                    width: "w-1/5",
                  },
                  {
                    phase: "Construction window",
                    window: "1–8 months (by project type)",
                    note: "On-site work, inspections, and punch list. Duration depends on the size of your project.",
                    width: "w-2/3",
                  },
                ].map((row) => (
                  <div key={row.phase} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{row.phase}</span>
                      <span>{row.window}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background">
                      <div className={`h-1.5 rounded-full bg-primary/80 ${row.width}`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{row.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                These ranges auto-adjust based on the type of project you selected (bathroom vs. full
                addition, for example). Your contractor will plug in specific dates and durations in their
                proposal and the contractor portal once a bid is accepted.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground">
              This preview shows the structure of the bid packet your contractors will see. Once our
              team has finalized the detailed scope and line items, you&apos;ll be able to send it out
              for bids directly from this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bidLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/homeowner/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!bidPacketData?.packet) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/homeowner/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Bid packet is being prepared
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-muted-foreground space-y-2">
            <p>
              Once our estimating team finishes packaging your scope of work and line items, your
              full bid packet will appear here. You'll be able to review the scope, inclusions and
              exclusions, and trade-by-trade details in one place.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => navigate("/homeowner/projects")}
            >
              Go to My Projects
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { packet, tradeSections } = bidPacketData;

  return (
    <div className="space-y-6 max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => navigate("/homeowner/projects")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Projects
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span>Ready to request bids?</span>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleRequestBids}
              disabled={isRequestingBids}
            >
              <Send className="h-3.5 w-3.5" />
              {hasProposals ? "View proposals" : isRequestingBids ? "Sending..." : "Request contractor bids"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Once you&apos;re comfortable with this scope, send it to SmartReno&apos;s contractor
          network so vetted pros can submit detailed proposals for your project.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Bid packet: scope of work
            </span>
            <button
              type="button"
              onClick={() => navigate(`/homeowner/projects/${activeProject.id}/files`)}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View photos & files
              <ArrowRight className="h-3 w-3" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="font-medium text-foreground">
                {packet.title || activeProject.project_type || "Renovation project"}
              </p>
            </div>
            {packet.bid_due_date && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bid finalized</p>
                <p className="text-foreground">
                  {format(new Date(packet.bid_due_date), "MMM d, yyyy")}
                </p>
              </div>
            )}
            {/* Address and other personal details are intentionally omitted
                from this homeowner-facing packet view. */}
            {packet.estimated_budget_min && packet.estimated_budget_max && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Target budget range</p>
                <p className="text-foreground">
                  ${(packet.estimated_budget_min / 1000).toFixed(0)}k – $
                  {(packet.estimated_budget_max / 1000).toFixed(0)}k
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Scope summary</p>
            <p className="text-sm text-foreground whitespace-pre-line">
              {packet.scope_summary ||
                "This section will summarize the main rooms, phases, and big-picture scope for your renovation once estimating is complete."}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Line-item scope (no pricing)</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-2 py-1 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-2 py-1 text-right font-medium text-muted-foreground w-16">Qty</th>
                    <th className="px-2 py-1 text-left font-medium text-muted-foreground w-16">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeSections.length > 0 &&
                    tradeSections.flatMap((section: any, sIdx: number) => {
                      if (section.bid_packet_line_items?.length) {
                        return section.bid_packet_line_items.map((item: any, idx: number) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="px-2 py-1 align-top text-muted-foreground">
                              {sIdx + 1}.{idx + 1}
                            </td>
                            <td className="px-2 py-1 align-top text-foreground">
                              <span className="font-medium">{section.trade}</span>
                              {": "}
                              {item.description}
                            </td>
                            <td className="px-2 py-1 align-top text-right text-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-2 py-1 align-top text-foreground">
                              {item.unit}
                            </td>
                          </tr>
                        ));
                      }
                      return (
                        <tr key={section.id} className="border-b last:border-0">
                          <td className="px-2 py-1 align-top text-muted-foreground">
                            {sIdx + 1}
                          </td>
                          <td className="px-2 py-1 align-top text-foreground">
                            <span className="font-medium">{section.trade}</span>
                            {section.scope_notes ? ` – ${section.scope_notes}` : ""}
                          </td>
                          <td className="px-2 py-1 align-top text-right text-foreground">—</td>
                          <td className="px-2 py-1 align-top text-foreground">—</td>
                        </tr>
                      );
                    })}

                  {tradeSections.length === 0 &&
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-2 py-1 align-top text-muted-foreground">{i}</td>
                        <td className="px-2 py-1 align-top text-muted-foreground">
                          Example scope item (demolition, framing, electrical, etc.)
                        </td>
                        <td className="px-2 py-1 align-top text-right text-muted-foreground">—</td>
                        <td className="px-2 py-1 align-top text-muted-foreground">—</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Contractors will base their pricing on this breakdown. In the homeowner view we hide unit
              prices and amounts so you can focus on scope and apples-to-apples comparisons.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Inclusions</p>
              <p className="text-sm text-foreground whitespace-pre-line">
                {packet.inclusions ||
                  "Everything that is included in the bids for this project will be listed here (labor, materials, permits, cleanup, etc.)."}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Exclusions</p>
              <p className="text-sm text-foreground whitespace-pre-line">
                {packet.exclusions ||
                  "Items that are specifically not included in the bids (appliances, specialty fixtures, landscaping, etc.) will show here so there are no surprises."}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Materials & selections</p>
              <p className="text-sm text-foreground whitespace-pre-line">
                {packet.design_selections_notes ||
                  "As you and your estimator lock in flooring, tile, cabinets, roofing, and other selections, the key choices will be summarized in this section."}
              </p>
            </div>
          </div>

          {tradeSections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Scope by trade & measurements
              </p>
              <div className="space-y-3">
                {tradeSections.map((section: any) => (
                  <div key={section.id} className="border border-border rounded-md p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{section.trade}</p>
                      {section.allowance_amount && (
                        <span className="text-xs text-muted-foreground">
                          Allowance: ${Number(section.allowance_amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {section.scope_notes && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {section.scope_notes}
                      </p>
                    )}
                    {section.bid_packet_line_items?.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {section.bid_packet_line_items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                          >
                            <span className="text-foreground">{item.description}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tradeSections.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Scope by trade & measurements
              </p>
              <div className="rounded-md border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
                Detailed breakdowns by trade (carpentry, electrical, plumbing, painting, etc.)
                and their associated quantities will appear here once your bid packet is finalized.
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            This bid packet summarizes the scope, inclusions, exclusions, and trade-by-trade
            quantities your proposals are based on. Use this as the single source of truth when
            you compare bids with your SmartReno team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

