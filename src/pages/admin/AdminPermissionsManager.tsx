import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Shield, Users, Search, RefreshCw, Lock, Key } from "lucide-react";

const ROLE_PERMISSIONS: Record<string, { label: string; permissions: string[] }> = {
  homeowner: {
    label: "Homeowner",
    permissions: [
      "view:own_projects",
      "view:own_documents",
      "view:own_messages",
      "view:own_bids",
      "create:warranty_claims",
      "select:contractor",
    ],
  },
  contractor: {
    label: "Contractor",
    permissions: [
      "view:invited_bid_packets",
      "create:bid_submissions",
      "view:own_bids",
      "view:won_projects",
      "create:daily_logs",
      "view:own_messages",
    ],
  },
  estimator: {
    label: "Estimator",
    permissions: [
      "view:assigned_projects",
      "manage:scope_builder",
      "manage:vendor_quotes",
      "upload:field_photos",
      "view:timeline",
      "view:project_financials",
      "generate:ai_scope",
    ],
  },
  admin: {
    label: "Admin",
    permissions: [
      "full:system_access",
      "manage:users",
      "manage:roles",
      "manage:permissions",
      "view:audit_log",
      "manage:workflow",
      "manage:financials",
      "manage:change_orders",
      "manage:analytics",
    ],
  },
  design_professional: {
    label: "Design Professional",
    permissions: [
      "view:assigned_projects",
      "create:design_proposals",
      "upload:portfolio",
      "view:own_messages",
    ],
  },
  vendor: {
    label: "Vendor",
    permissions: [
      "view:quote_requests",
      "create:quote_responses",
    ],
  },
};

export default function AdminPermissionsManager() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: permissions, isLoading, refetch } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: roleCounts } = useQuery({
    queryKey: ["role-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Permissions & Data Governance</h1>
            <p className="text-muted-foreground">
              Role-based access control and granular permission management
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Role Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
            <Card key={role}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{roleCounts?.[role] || 0}</p>
                  <p className="text-xs text-muted-foreground">{config.label}s</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Access Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Role Access Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
                <div key={role} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{config.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {config.permissions.length} permissions
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {config.permissions.map((perm) => (
                      <li key={perm} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Key className="h-3 w-3 shrink-0" />
                        <code className="text-[11px]">{perm}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Granular Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                Granular Permission Overrides
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-[180px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading permissions...</p>
            ) : !permissions?.length ? (
              <div className="text-center py-10 text-muted-foreground">
                <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No granular overrides configured</p>
                <p className="text-xs mt-1">
                  All users follow standard role-based access. Overrides can be added for specific users or resources.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {permissions
                  .filter((p) => {
                    if (!searchTerm) return true;
                    const t = searchTerm.toLowerCase();
                    return p.permission.toLowerCase().includes(t) || p.role.toLowerCase().includes(t);
                  })
                  .map((perm) => (
                    <div key={perm.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent/50 text-sm">
                      <Key className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{perm.role}</Badge>
                          <code className="text-xs">{perm.permission}</code>
                          {perm.resource_type && (
                            <Badge variant="outline" className="text-[10px]">{perm.resource_type}</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(perm.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
