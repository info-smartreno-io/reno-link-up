import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Image, 
  MapPin, 
  Calendar, 
  Clock, 
  Download, 
  Eye,
  DollarSign
} from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { SubBidSubmissionDialog } from "./SubBidSubmissionDialog";

interface ScopeDocument {
  url: string;
  name: string;
  type: string;
}

interface ScopePhoto {
  url: string;
  caption?: string;
}

interface BidPackage {
  id: string;
  trade: string;
  project_id: string;
  status: string;
  budget_amount: number | null;
  scope_description: string | null;
  scope_documents: ScopeDocument[];
  scope_photos: ScopePhoto[];
  blueprints: ScopeDocument[];
  due_date: string | null;
  project_address: string | null;
  notes_for_subs: string | null;
  created_at: string;
}

interface SubBidOpportunityCardProps {
  package_: BidPackage;
  hasSubmittedBid: boolean;
  onBidSubmitted: () => void;
}

export function SubBidOpportunityCard({ 
  package_, 
  hasSubmittedBid, 
  onBidSubmitted 
}: SubBidOpportunityCardProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const isExpired = package_.due_date ? isPast(new Date(package_.due_date)) : false;
  const dueInText = package_.due_date 
    ? formatDistanceToNow(new Date(package_.due_date), { addSuffix: true })
    : null;

  const downloadAll = () => {
    const allDocs = [
      ...(package_.scope_documents || []),
      ...(package_.blueprints || []),
    ];
    allDocs.forEach((doc) => {
      window.open(doc.url, "_blank");
    });
  };

  return (
    <>
      <Card className={isExpired ? "opacity-60" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {package_.trade}
                {hasSubmittedBid && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">
                    Bid Submitted
                  </Badge>
                )}
              </CardTitle>
              {package_.project_address && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {package_.project_address}
                </CardDescription>
              )}
            </div>
            <div className="text-right">
              {package_.due_date && (
                <Badge 
                  variant={isExpired ? "destructive" : "outline"}
                  className="gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {isExpired ? "Expired" : `Due ${dueInText}`}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scope Description */}
          {package_.scope_description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Scope of Work</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {package_.scope_description}
              </p>
            </div>
          )}

          {/* Notes for Subs */}
          {package_.notes_for_subs && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">Notes from Coordinator</h4>
              <p className="text-sm text-muted-foreground">{package_.notes_for_subs}</p>
            </div>
          )}

          {/* Attachments Summary */}
          <div className="flex flex-wrap gap-3 text-sm">
            {package_.scope_photos?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setShowPhotos(!showPhotos)}
              >
                <Image className="h-3 w-3" />
                {package_.scope_photos.length} Photos
                <Eye className="h-3 w-3 ml-1" />
              </Button>
            )}
            {package_.scope_documents?.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {package_.scope_documents.length} Documents
              </Badge>
            )}
            {package_.blueprints?.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {package_.blueprints.length} Blueprints
              </Badge>
            )}
          </div>

          {/* Photo Gallery */}
          {showPhotos && package_.scope_photos?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {package_.scope_photos.map((photo, idx) => (
                <a
                  key={idx}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${idx + 1}`}
                    className="object-cover w-full h-full hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Due Date & Budget Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-4 text-sm text-muted-foreground">
              {package_.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {format(new Date(package_.due_date), "MMM d, yyyy")}
                </span>
              )}
              {package_.budget_amount && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Budget: ${package_.budget_amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {(package_.scope_documents?.length > 0 || package_.blueprints?.length > 0) && (
              <Button variant="outline" size="sm" onClick={downloadAll} className="gap-1">
                <Download className="h-3 w-3" />
                Download All
              </Button>
            )}
            <Button
              size="sm"
              className="ml-auto"
              disabled={isExpired || hasSubmittedBid}
              onClick={() => setShowSubmitDialog(true)}
            >
              {hasSubmittedBid ? "Bid Submitted" : "Submit Bid"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SubBidSubmissionDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        packageId={package_.id}
        trade={package_.trade}
        onSuccess={() => {
          setShowSubmitDialog(false);
          onBidSubmitted();
        }}
      />
    </>
  );
}
