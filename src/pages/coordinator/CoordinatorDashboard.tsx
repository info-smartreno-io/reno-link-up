import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PCSnapshot } from "@/components/coordinator/PCSnapshot";
import { PCProjectsTable } from "@/components/coordinator/PCProjectsTable";
import { Loader2 } from "lucide-react";

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has PC role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAccess = roles?.some(r => 
        ["project_coordinator", "admin", "contractor"].includes(r.role)
      );

      if (!hasAccess) {
        navigate("/");
        return;
      }

      setUserId(user.id);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h2 className="text-sm text-muted-foreground">Dashboard / Project Coordinator</h2>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Coordinator</h1>
          <p className="text-muted-foreground">
            Prepare sold jobs to be build-ready, on time, and on budget
          </p>
        </div>

        {/* KPI Snapshot */}
        <PCSnapshot coordinatorId={userId || undefined} />

        {/* Projects Table */}
        <PCProjectsTable coordinatorId={userId || undefined} />
      </main>
    </div>
  );
}
