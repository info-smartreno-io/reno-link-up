import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, CheckCircle2, Shield, Award, Palette, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { ImportedBusiness } from "@/hooks/useImportedBusinesses";

interface BusinessCardProps {
  business: ImportedBusiness;
  index: number;
  onRequestBid: () => void;
  type: "contractor" | "designer";
}

export function BusinessCard({ business, index, onRequestBid, type }: BusinessCardProps) {
  const initials = business.business_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const profileUrl = type === "contractor" ? `/contractor/${business.slug}` : `/designer/${business.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {business.photo_url ? (
            <img src={business.photo_url} alt={business.business_name} className="h-14 w-14 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground truncate">{business.business_name}</h3>
              {business.claim_status === "verified" && <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />}
            </div>
            {business.category && (
              <p className="text-sm text-muted-foreground capitalize">{business.category.replace(/_/g, " ")}</p>
            )}
          </div>
        </div>

        {business.google_rating && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-pending text-pending" />
              <span className="font-semibold text-card-foreground">{business.google_rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({business.review_count} reviews)</span>
          </div>
        )}

        {(business.city || business.state) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{[business.city, business.state].filter(Boolean).join(", ")}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {business.claim_status === "verified" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
              <Shield className="h-3 w-3" /> Verified
            </span>
          )}
          {business.source === "google_places" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              <ExternalLink className="h-3 w-3" /> Google
            </span>
          )}
        </div>

        {business.service_area_tags && business.service_area_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {business.service_area_tags.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{s}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm" onClick={onRequestBid}>
            <Palette className="h-4 w-4 mr-1" /> {type === "contractor" ? "Request to Bid" : "Request to Bid"}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link to={profileUrl}>View Profile</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
