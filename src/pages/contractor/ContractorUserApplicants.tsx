import React, { useState } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { useDemoMode } from "@/hooks/demo/useDemoMode";
import { getDemoApplicants } from "@/utils/demoContractorData";
import { useToast } from "@/hooks/use-toast";

type ApplicantType = "estimator" | "gc";

export default function ContractorUserApplicants() {
  const [applicantType, setApplicantType] = useState<ApplicantType>("estimator");
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();

  const { data: estimatorApplicants, isLoading: loadingEstimators } = useQuery({
    queryKey: ["estimator-applicants", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoApplicants().estimator_applicants;
      }
      const { data, error } = await supabase
        .from("estimator_applicants")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: gcApplicants, isLoading: loadingGC } = useQuery({
    queryKey: ["gc-applicants", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoApplicants().gc_applicants;
      }
      const { data, error } = await supabase
        .from("gc_applicants")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingEstimators || loadingGC;
  const currentData = applicantType === "estimator" ? estimatorApplicants : gcApplicants;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const handleViewApplicant = (applicant: any) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `Viewing details for ${applicant.name || applicant.contact_name}`,
      });
      return;
    }
    // Real implementation would navigate to detail view
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Applicants</h1>
          <p className="text-muted-foreground">Review and manage applicant submissions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Applicant Type</CardTitle>
              <Select value={applicantType} onValueChange={(value) => setApplicantType(value as ApplicantType)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimator">Estimator Applicants</SelectItem>
                  <SelectItem value="gc">General Contractor Applicants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading applicants...</div>
            ) : !currentData || currentData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No applicants found</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      {applicantType === "estimator" && <TableHead>Experience</TableHead>}
                      {applicantType === "gc" && <TableHead>Company</TableHead>}
                      <TableHead>Specializations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((applicant: any) => (
                      <TableRow key={applicant.id}>
                        <TableCell className="font-medium">{applicant.name || applicant.contact_name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${applicant.email}`} className="hover:underline">
                                {applicant.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {applicant.phone}
                            </div>
                          </div>
                        </TableCell>
                        {applicantType === "estimator" && (
                          <TableCell>{applicant.years_experience ? `${applicant.years_experience} years` : "N/A"}</TableCell>
                        )}
                        {applicantType === "gc" && (
                          <TableCell>
                            <div>
                              <div className="font-medium">{applicant.company_name}</div>
                              {applicant.years_in_business && (
                                <div className="text-xs text-muted-foreground">
                                  {applicant.years_in_business} years in business
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {applicant.specializations?.slice(0, 2).map((spec: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {applicant.specializations?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{applicant.specializations.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(applicant.status || "pending")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {applicant.created_at ? format(new Date(applicant.created_at), "MMM d, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewApplicant(applicant)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ContractorLayout>
  );
}