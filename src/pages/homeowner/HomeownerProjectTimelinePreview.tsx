import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

export default function HomeownerProjectTimelinePreview() {
  const navigate = useNavigate();

  const phases = [
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
  ];

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
              Projected timeline
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">
            This is your high-level renovation journey, from intake through construction. Exact dates will
            be confirmed once a contractor is selected and permits are approved.
          </div>

          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            {phases.map((row) => (
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
        </CardContent>
      </Card>
    </div>
  );
}

