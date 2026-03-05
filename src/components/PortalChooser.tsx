import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PORTAL_LABELS, PortalKey } from "@/config/portalUrls";
import { Home, Briefcase, FileText, Shield, Building, Palette, Package } from "lucide-react";

const portalIcons: Record<PortalKey, React.ReactNode> = {
  homeowner: <Home className="h-5 w-5" />,
  contractor: <Briefcase className="h-5 w-5" />,
  estimator: <FileText className="h-5 w-5" />,
  admin: <Shield className="h-5 w-5" />,
  architect: <Building className="h-5 w-5" />,
  interiordesigner: <Palette className="h-5 w-5" />,
  vendor: <Package className="h-5 w-5" />,
};

export const PortalChooser: React.FC = () => {
  const navigate = useNavigate();

  const portals: PortalKey[] = ["homeowner", "contractor", "estimator", "architect", "interiordesigner", "vendor", "admin"];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
      {portals.map((portal) => (
        <Button
          key={portal}
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => navigate(`/login/${portal}`)}
        >
          {portalIcons[portal]}
          <span>{PORTAL_LABELS[portal]}</span>
        </Button>
      ))}
    </div>
  );
};
