import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function HomeownerProjectInclusions() {
  const navigate = useNavigate();

  const { data: intakeProject, isLoading } = useQuery({
    queryKey: ["homeowner-intake-inclusions"],
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
        console.error("[HomeownerProjectInclusions] intake fallback error", error);
        return null;
      }

      return data;
    },
  });

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
              Inclusions & exclusions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">
            These guidelines help every contractor price the same scope. Your estimator can fine-tune
            details before bids go out.
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
                  <td className="px-2 py-1 align-top font-medium text-foreground">Inclusions</td>
                  <td className="px-2 py-1 align-top text-muted-foreground">
                    Labor, materials, permits, and cleanup that are expected to be part of the bids.
                  </td>
                  <td className="px-2 py-1 align-top text-muted-foreground">
                    Demo, framing, finishes, typical site protection, haul-away, and standard permit fees
                    (unless noted otherwise).
                  </td>
                </tr>
                <tr>
                  <td className="px-2 py-1 align-top font-medium text-foreground">Exclusions</td>
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
        </CardContent>
      </Card>
    </div>
  );
}

