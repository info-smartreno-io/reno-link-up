import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function HomeownerProjectMaterials() {
  const navigate = useNavigate();

  const { data: intakeProject, isLoading } = useQuery({
    queryKey: ["homeowner-intake-materials"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, project_type, city, zip_code")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[HomeownerProjectMaterials] intake fallback error", error);
        return null;
      }

      return data;
    },
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => navigate("/homeowner/bid-packet")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bid packet
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Materials & selections
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">
            This table auto-fills based on your scope of work (for example, kitchen vs. bath vs.
            whole-home). Your estimator will dial in the exact selections schedule.
          </div>

          <div className="text-xs text-muted-foreground">
            Project:{" "}
            <span className="font-medium text-foreground">
              {(intakeProject as any)?.project_type || (intakeProject as any)?.project_name || "Renovation project"}
            </span>
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}

