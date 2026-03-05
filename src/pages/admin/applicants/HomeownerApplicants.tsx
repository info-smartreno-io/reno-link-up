import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ApplicantTable, getStatusVariant } from "@/components/admin/applicants/ApplicantTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function HomeownerApplicants() {
  const { data: applicants, isLoading } = useQuery({
    queryKey: ["homeowner-applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homeowner_applicants")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "project_type", label: "Project Type" },
    { key: "budget_range", label: "Budget" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>{value}</Badge>
      ),
    },
    {
      key: "created_at",
      label: "Submitted",
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homeowner Applicants</h1>
          <p className="text-muted-foreground mt-2">
            Review homeowner project inquiries and applications
          </p>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ApplicantTable data={applicants || []} columns={columns} />
        )}
      </div>
    </AdminLayout>
  );
}
