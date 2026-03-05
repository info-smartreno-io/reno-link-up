import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ApplicantTable, getStatusVariant } from "@/components/admin/applicants/ApplicantTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function CostCalculatorSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["calculator-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_calculator_submissions")
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
    { key: "square_footage", label: "Sq Ft" },
    { key: "location", label: "Location" },
    {
      key: "estimated_cost",
      label: "Estimated Cost",
      render: (value: number) => value ? `$${value.toLocaleString()}` : "-",
    },
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
          <h1 className="text-3xl font-bold">Cost Calculator Submissions</h1>
          <p className="text-muted-foreground mt-2">
            Review cost estimates from website calculator
          </p>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ApplicantTable data={submissions || []} columns={columns} />
        )}
      </div>
    </AdminLayout>
  );
}
