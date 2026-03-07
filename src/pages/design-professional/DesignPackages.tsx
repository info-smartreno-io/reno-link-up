import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Package, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DESIGN_PACKAGE_SECTIONS, calculatePackageCompletion, isPackageReadyForRFP } from "@/config/designProfessionalOptions";
import { DesignPackageEditor } from "@/components/design-professional/DesignPackageEditor";

interface DesignPackage {
  id: string;
  project_id: string | null;
  package_status: string;
  package_completion_percent: number;
  ready_for_rfp: boolean;
  internal_review_status: string;
  created_at: string;
}

export default function DesignPackages() {
  const queryClient = useQueryClient();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["design-packages"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("design_packages")
        .select("*")
        .eq("assigned_design_professional_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DesignPackage[];
    },
  });

  if (selectedPackageId) {
    return <DesignPackageEditor packageId={selectedPackageId} onBack={() => setSelectedPackageId(null)} />;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "in_progress": return "default";
      case "review": return "outline";
      case "approved": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Design Packages</h1>
        <p className="text-muted-foreground">Manage your design packages for project handoffs</p>
      </div>

      {packages?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No design packages yet</h3>
            <p className="text-muted-foreground">Design packages will appear here when you are assigned to projects.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {packages?.map((pkg) => (
            <Card key={pkg.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPackageId(pkg.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">Package #{pkg.id.slice(0, 8)}</h3>
                      <Badge variant={statusColor(pkg.package_status)}>{pkg.package_status}</Badge>
                      {pkg.ready_for_rfp && <Badge className="bg-green-600">RFP Ready</Badge>}
                    </div>
                    <Progress value={pkg.package_completion_percent} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{pkg.package_completion_percent}% complete</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
