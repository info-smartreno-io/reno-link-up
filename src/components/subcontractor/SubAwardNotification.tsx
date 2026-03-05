import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { SubDateConfirmationDialog } from "./SubDateConfirmationDialog";

interface AwardedBid {
  id: string;
  package_id: string;
  bid_amount: number;
  is_awarded: boolean;
  awarded_at: string | null;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  date_confirmed_at: string | null;
  trade: string;
  project_address: string | null;
  project_id: string;
}

interface SubAwardNotificationProps {
  award: AwardedBid;
  onDateConfirmed: () => void;
}

export function SubAwardNotification({ award, onDateConfirmed }: SubAwardNotificationProps) {
  const [showDateDialog, setShowDateDialog] = useState(false);

  const isDateConfirmed = !!award.date_confirmed_at;
  const hasDatesProposed = !!award.scheduled_start_date;

  return (
    <>
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-700">Bid Awarded!</CardTitle>
            </div>
            <Badge className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Awarded
            </Badge>
          </div>
          <CardDescription>
            Congratulations! Your bid for {award.trade} has been selected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Award Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Amount: </span>
                <span className="font-medium">${award.bid_amount.toLocaleString()}</span>
              </span>
            </div>
            {award.project_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">
                  {award.project_address}
                </span>
              </div>
            )}
            {award.awarded_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Awarded: {format(new Date(award.awarded_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Scheduled Dates */}
          {hasDatesProposed && (
            <div className="p-3 bg-background rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Proposed Schedule</h4>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Start: </span>
                  {format(new Date(award.scheduled_start_date!), "MMM d, yyyy")}
                </span>
                {award.scheduled_end_date && (
                  <span>
                    <span className="text-muted-foreground">End: </span>
                    {format(new Date(award.scheduled_end_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>
              {isDateConfirmed ? (
                <Badge variant="outline" className="mt-2 bg-green-500/10 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Dates Confirmed
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowDateDialog(true)}
                >
                  Confirm Dates
                </Button>
              )}
            </div>
          )}

          {/* No dates yet */}
          {!hasDatesProposed && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              The project coordinator will propose scheduling dates soon. You'll be
              notified when dates are available to confirm.
            </div>
          )}
        </CardContent>
      </Card>

      <SubDateConfirmationDialog
        open={showDateDialog}
        onOpenChange={setShowDateDialog}
        bidResponseId={award.id}
        proposedStart={award.scheduled_start_date}
        proposedEnd={award.scheduled_end_date}
        onSuccess={() => {
          setShowDateDialog(false);
          onDateConfirmed();
        }}
      />
    </>
  );
}
