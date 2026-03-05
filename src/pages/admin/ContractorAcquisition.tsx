import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  useContractorLeads, 
  useAcquisitionStats,
  useTriggerOutreach,
  useCalculateQualityScore,
  useCreateContractorLead,
} from "@/hooks/useContractorAcquisition";
import { Mail, MessageSquare, Phone, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContractorAcquisition() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [qualityFilter, setQualityFilter] = useState<number>(0);
  
  const { data: stats } = useAcquisitionStats();
  const { data: leads, isLoading } = useContractorLeads({
    status: statusFilter || undefined,
    minQualityScore: qualityFilter || undefined,
  });
  
  const triggerOutreach = useTriggerOutreach();
  const calculateScore = useCalculateQualityScore();
  const createLead = useCreateContractorLead();

  const [newLead, setNewLead] = useState({
    contractor_name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    service_areas: [] as string[],
  });

  const handleOutreach = async (leadId: string, type: 'email' | 'sms' | 'both') => {
    try {
      await triggerOutreach.mutateAsync({ contractorLeadId: leadId, outreachType: type });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCalculateScore = async (leadId: string) => {
    try {
      await calculateScore.mutateAsync(leadId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.contractor_name || !newLead.email) {
      toast.error('Contractor name and email are required');
      return;
    }

    try {
      await createLead.mutateAsync({
        ...newLead,
        outreach_status: 'new',
        emails_sent: 0,
        sms_sent: 0,
        calls_made: 0,
        insurance_verified: false,
      });
      
      setNewLead({
        contractor_name: '',
        email: '',
        phone: '',
        specialties: [],
        service_areas: [],
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: 'default',
      contacted: 'secondary',
      scheduled: 'outline',
      onboarded: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getQualityBadge = (score?: number) => {
    if (!score) return <Badge variant="outline">Not Scored</Badge>;
    if (score >= 80) return <Badge className="bg-green-500">High ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Medium ({score})</Badge>;
    return <Badge className="bg-red-500">Low ({score})</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contractor Acquisition</h1>
        <p className="text-muted-foreground">
          Manage contractor leads, outreach campaigns, and onboarding pipeline
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.new || 0} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.highQuality || 0}</div>
            <p className="text-xs text-muted-foreground">
              Score 80+
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.contacted || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onboarded || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active contractors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="add">Add Lead</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="w-[200px]">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="onboarded">Onboarded</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[200px]">
                <Label>Min Quality Score</Label>
                <Select value={qualityFilter.toString()} onValueChange={(v) => setQualityFilter(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="60">60+ (Medium)</SelectItem>
                    <SelectItem value="80">80+ (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Leads</CardTitle>
              <CardDescription>
                {leads?.length || 0} leads found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outreach</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : leads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads?.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.contractor_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {lead.years_in_business ? `${lead.years_in_business} years` : 'Unknown'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {lead.email && <div>{lead.email}</div>}
                            {lead.phone && <div>{lead.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lead.specialties?.slice(0, 2).map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                            {(lead.specialties?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(lead.specialties?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getQualityBadge(lead.quality_score)}</TableCell>
                        <TableCell>{getStatusBadge(lead.outreach_status)}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>📧 {lead.emails_sent}</div>
                            <div>📱 {lead.sms_sent}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!lead.quality_score && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCalculateScore(lead.id)}
                              >
                                Score
                              </Button>
                            )}
                            {lead.outreach_status === 'new' && lead.email && (
                              <Button
                                size="sm"
                                onClick={() => handleOutreach(lead.id, 'email')}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add Contractor Lead</CardTitle>
              <CardDescription>
                Manually add a contractor to the acquisition pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractor_name">Contractor Name *</Label>
                  <Input
                    id="contractor_name"
                    value={newLead.contractor_name}
                    onChange={(e) => setNewLead({ ...newLead, contractor_name: e.target.value })}
                    placeholder="ABC Contracting LLC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="contact@abccontracting.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(973) 555-0123"
                  />
                </div>
              </div>

              <Button onClick={handleCreateLead}>
                Add Contractor Lead
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Import contractor leads from Clay.com or CSV file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This feature allows you to import contractor data from external sources.
                Contact your admin for Clay.com API integration.
              </p>
              <Button variant="outline" disabled>
                Upload CSV
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
