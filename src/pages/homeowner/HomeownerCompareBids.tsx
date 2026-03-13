import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHomeownerProposals, useSelectContractor } from "@/hooks/useHomeownerData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type ContractorSnapshot = {
  id: string;
  name: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  years_in_business: number | null;
  has_in_house_designer: boolean;
  uses_subcontractors: boolean;
  crew_size: number | null;
  project_manager_count: number;
  has_dedicated_estimator: boolean;
  website: string | null;
  google_business_url: string | null;
  instagram_url: string | null;
};

export default function HomeownerCompareBids() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const { data: bids = [], isLoading } = useHomeownerProposals(projectId);
  const selectContractor = useSelectContractor(projectId);

  const topThree = useMemo(
    () =>
      [...bids]
        .sort((a: any, b: any) => {
          // Prefer shortlisted/accepted first, then by bid amount ascending
          const order = ["accepted", "shortlisted", "submitted"];
          const aIdx = order.indexOf(a.status || "submitted");
          const bIdx = order.indexOf(b.status || "submitted");
          if (aIdx !== bIdx) return aIdx - bIdx;
          if (a.bid_amount && b.bid_amount) return a.bid_amount - b.bid_amount;
          return 0;
        })
        .slice(0, 3),
    [bids]
  );

  const contractorIds = useMemo(
    () =>
      Array.from(
        new Set(
          topThree
            .filter((b: any) => b.bidder_type === "contractor" && b.bidder_id)
            .map((b: any) => b.bidder_id as string)
        )
      ),
    [topThree]
  );

  const { data: contractors } = useQuery({
    queryKey: ["compare-bids-contractors", contractorIds],
    enabled: contractorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select(
          "id, name, google_rating, google_review_count, website, google_business_url, instagram_url, has_in_house_designer, uses_subcontractors, crew_size, project_manager_count, has_dedicated_estimator"
        )
        .in("id", contractorIds);
      if (error) throw error;
      return (data || []) as ContractorSnapshot[];
    },
  });

  const contractorById: Record<string, ContractorSnapshot> = useMemo(() => {
    const map: Record<string, ContractorSnapshot> = {};
    (contractors || []).forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [contractors]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const columns = topThree.map((bid: any) => {
    const contractor = bid.bidder_type === "contractor" && bid.bidder_id
      ? contractorById[bid.bidder_id as string]
      : undefined;
    return { bid, contractor };
  });

  const formatYesNo = (v: boolean | null | undefined) =>
    v ? "Yes" : v === false ? "No" : "—";

  const formatCurrency = (n: number | null | undefined) =>
    typeof n === "number" ? `$${n.toLocaleString()}` : "—";

  const formatRating = (c?: ContractorSnapshot) =>
    c?.google_rating ? `${c.google_rating.toFixed(1)} (${c.google_review_count || 0} reviews)` : "—";

  const emptyColumns =
    !columns.length
      ? [
          { label: "Bid 1" },
          { label: "Bid 2" },
          { label: "Bid 3" },
        ]
      : [];

  return (
    <div className="space-y-6 max-w-5xl">
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
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Compare bids
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            SmartReno lines up the top three proposals for this project so you can compare pricing,
            timeline, and who you&apos;re actually hiring.
          </p>

          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left text-muted-foreground w-40">Details</th>
                  {columns.length > 0
                    ? columns.map(({ bid, contractor }) => (
                        <th key={bid.id} className="px-3 py-2 text-left text-foreground w-48">
                          <div className="font-medium truncate">
                            {contractor?.name || bid.companyName || "Contractor"}
                          </div>
                          {formatRating(contractor) !== "—" && (
                            <div className="text-[11px] text-muted-foreground">
                              Google: {formatRating(contractor)}
                            </div>
                          )}
                        </th>
                      ))
                    : emptyColumns.map((col) => (
                        <th key={col.label} className="px-3 py-2 text-left text-muted-foreground w-48">
                          {col.label}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Price (bid amount)</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 font-medium text-foreground"
                      >
                        {formatCurrency((columns[idx] as any).bid.bid_amount)}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 font-medium text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Estimated duration</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.project_duration_weeks
                          ? `${(columns[idx] as any).bid.project_duration_weeks} weeks`
                          : (columns[idx] as any).bid.estimated_timeline || "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Anticipated start window</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.anticipated_start_date
                          ? new Date(
                              (columns[idx] as any).bid.anticipated_start_date
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Years in business</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.years_in_business ?? "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Project management team</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).contractor
                          ? `${(columns[idx] as any).contractor.project_manager_count || 0} PMs`
                          : "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Works with designer / architect</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-foreground"
                      >
                        {formatYesNo((columns[idx] as any).contractor?.has_in_house_designer)}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Uses subcontractors</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-foreground"
                      >
                        {formatYesNo((columns[idx] as any).contractor?.uses_subcontractors)}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Dedicated estimator</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-foreground"
                      >
                        {formatYesNo((columns[idx] as any).contractor?.has_dedicated_estimator)}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Warranty (years)</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.warranty_years ?? "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Crew size on your job</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.crew_size
                          ? `${(columns[idx] as any).bid.crew_size} people`
                          : "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Online presence</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).contractor?.id || idx}
                        className="px-3 py-2 text-xs text-foreground space-y-1"
                      >
                        {(columns[idx] as any).contractor?.website && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Website: </span>
                            <a
                              href={(columns[idx] as any).contractor.website}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              {(columns[idx] as any).contractor.website.replace(
                                /^https?:\/\//,
                                ""
                              )}
                            </a>
                          </div>
                        )}
                        {(columns[idx] as any).contractor?.google_business_url && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Google: </span>
                            <a
                              href={(columns[idx] as any).contractor.google_business_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              View profile
                            </a>
                          </div>
                        )}
                        {(columns[idx] as any).contractor?.instagram_url && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Instagram: </span>
                            <a
                              href={(columns[idx] as any).contractor.instagram_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              View profile
                            </a>
                          </div>
                        )}
                        {!(
                          (columns[idx] as any).contractor?.website ||
                          (columns[idx] as any).contractor?.google_business_url ||
                          (columns[idx] as any).contractor?.instagram_url
                        ) && "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">Start date</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-2 text-foreground"
                      >
                        {(columns[idx] as any).bid.anticipated_start_date
                          ? new Date(
                              (columns[idx] as any).bid.anticipated_start_date
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-2 text-muted-foreground">
                        —
                      </td>
                    )
                  )}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-3 text-muted-foreground align-middle">Approve bid</td>
                  {(columns.length ? columns : emptyColumns).map((col: any, idx: number) =>
                    columns.length ? (
                      <td
                        key={(columns[idx] as any).bid.id}
                        className="px-3 py-3 text-foreground"
                      >
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-primary bg-primary text-white text-xs px-3 py-1.5 hover:bg-primary/90 disabled:opacity-60"
                          onClick={() => selectContractor.mutate((columns[idx] as any).bid.id)}
                          disabled={selectContractor.isPending}
                        >
                          {selectContractor.isPending ? "Approving..." : "Approve bid"}
                        </button>
                      </td>
                    ) : (
                      <td key={col.label} className="px-3 py-3 text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-muted-foreground/40 text-xs px-3 py-1.5 opacity-60 cursor-not-allowed"
                          disabled
                        >
                          Approve bid
                        </button>
                      </td>
                    )
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            By approving a bid in SmartReno you are indicating your non-binding intent to move forward
            with that contractor&apos;s proposal for further discussion. This approval does not create a
            contract, does not authorize work to begin, and does not obligate you or the contractor to
            enter into any construction agreement. It simply enables direct communication and scheduling
            of site visits between you and the selected contractor so that a separate written contract can
            be reviewed, negotiated, and executed if you choose to proceed.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
            Contractors invited to bid on your project are matched based on the capabilities and trades
            they have indicated in their SmartReno profile, along with their service areas and general
            scheduling availability for projects like yours. Every contractor on the platform has been
            screened by SmartReno for appropriate licensing and insurance to the best of our ability;
            however, you should still review their credentials and proposed contract terms independently
            before authorizing any work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

