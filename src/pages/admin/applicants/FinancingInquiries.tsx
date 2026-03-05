import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ApplicantTable, getStatusVariant } from "@/components/admin/applicants/ApplicantTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function FinancingInquiries() {
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["financing-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_inquiries")
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
    {
      key: "project_cost",
      label: "Project Cost",
      render: (value: number) => value ? `$${value.toLocaleString()}` : "-",
    },
    {
      key: "desired_loan_amount",
      label: "Loan Amount",
      render: (value: number) => value ? `$${value.toLocaleString()}` : "-",
    },
    { key: "credit_score_range", label: "Credit Score" },
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
          <h1 className="text-3xl font-bold">Financing Inquiries</h1>
          <p className="text-muted-foreground mt-2">
            Review financing requests and loan applications
          </p>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ApplicantTable data={inquiries || []} columns={columns} />
        )}
      </div>
    </AdminLayout>
  );
}
