import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle, Clock, AlertCircle, Eye, Download } from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoPermitTracking } from "@/utils/demoContractorData";
import { useToast } from "@/hooks/use-toast";

export default function ContractorPermitTracking() {
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();
  
  // Use demo data in demo mode
  const permitData = isDemoMode ? getDemoPermitTracking() : { summary: { total: 0, approved: 0, inProcess: 0, pending: 0 }, permits: [] };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "in_process":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Process</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (permitId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Permit details would open here (demo action)",
      });
      return;
    }
    // Real implementation would navigate to permit details
  };

  const handleDownload = (permitId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Permit document would download (demo action)",
      });
      return;
    }
    // Real implementation would download permit document
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permit Tracking</h1>
          <p className="text-muted-foreground mt-1">Track all permits across your projects</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Permits</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{permitData.summary.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{permitData.summary.approved}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Process</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{permitData.summary.inProcess}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{permitData.summary.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Permits Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">All Permits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Project</TableHead>
                  <TableHead className="text-muted-foreground">Permit Type</TableHead>
                  <TableHead className="text-muted-foreground">Municipality</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Applied</TableHead>
                  <TableHead className="text-muted-foreground">Permit #</TableHead>
                  <TableHead className="text-muted-foreground">Fees</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permitData.permits.map((permit) => (
                  <TableRow key={permit.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{permit.project_name}</div>
                        <div className="text-sm text-muted-foreground">{permit.project_location}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{permit.permit_type}</TableCell>
                    <TableCell className="text-foreground">{permit.municipality}</TableCell>
                    <TableCell>{getStatusBadge(permit.status)}</TableCell>
                    <TableCell className="text-foreground">{permit.application_date}</TableCell>
                    <TableCell className="text-foreground">{permit.permit_number || "—"}</TableCell>
                    <TableCell className="text-foreground">${permit.fees.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetails(permit.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {permit.status === "approved" && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownload(permit.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ContractorLayout>
  );
}
