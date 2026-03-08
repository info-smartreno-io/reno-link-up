import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface RevisionBannerProps {
  revisionNotes: string | null;
  revisionRequestedAt: string | null;
  revisionCount: number;
}

export function RevisionBanner({ revisionNotes, revisionRequestedAt, revisionCount }: RevisionBannerProps) {
  if (!revisionNotes && !revisionRequestedAt) return null;

  return (
    <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-amber-800 dark:text-amber-300">Revision Requested</span>
            {revisionCount > 1 && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-400">
                Round {revisionCount}
              </Badge>
            )}
          </div>
          {revisionNotes && (
            <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-line">{revisionNotes}</p>
          )}
          {revisionRequestedAt && (
            <p className="text-xs text-amber-600/70 mt-1">
              Requested {format(new Date(revisionRequestedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
