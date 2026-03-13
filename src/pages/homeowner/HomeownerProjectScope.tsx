import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function HomeownerProjectScope() {
  const navigate = useNavigate();

  const { data: intakeProject, isLoading } = useQuery({
    queryKey: ["homeowner-intake-scope"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, project_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[HomeownerProjectScope] intake fallback error", error);
        return null;
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
              Scope & line items
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">
            This gives contractors a clear breakdown of the work they&apos;re pricing, without showing any
            dollars on the homeowner side.
          </div>

          <div className="text-xs text-muted-foreground">
            Project:{" "}
            <span className="font-medium text-foreground">
              {(intakeProject as any)?.project_type || (intakeProject as any)?.project_name || "Renovation project"}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Line-item scope preview (no pricing)
            </p>
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
                      <td className="px-2 py-1 align-top text-foreground">{row.desc}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}

