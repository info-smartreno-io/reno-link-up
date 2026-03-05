import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Plus, Send, Mail, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  target_status: string;
  trigger_after_days: number;
  email_subject: string;
  email_template: string;
  offer_details: string | null;
  discount_percentage: number | null;
  is_active: boolean;
  created_at: string;
}

interface CampaignSend {
  id: string;
  campaign_id: string;
  lead_id: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  responded_at: string | null;
  response_type: string | null;
  leads?: {
    name: string;
    email: string;
    project_type: string;
  };
  winback_campaigns?: {
    name: string;
  };
}

const DEFAULT_TEMPLATE = `<p>Hi {leadName},</p>

<p>We noticed it's been a while since we last connected about your {projectType} project.</p>

<p>We understand that timing isn't always perfect, and circumstances change. If you're still interested in moving forward with your renovation, we'd love to help make it happen.</p>

<p>Our team is ready to work with you to create a solution that fits your needs and budget.</p>

<p>Looking forward to hearing from you!</p>

<p>Best regards,<br>The SmartReno Team</p>`;

export default function WinbackCampaigns() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignSends, setCampaignSends] = useState<CampaignSend[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCampaignForSend, setSelectedCampaignForSend] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    target_status: "lost" as "lost" | "on_hold",
    trigger_after_days: 30,
    email_subject: "",
    email_template: DEFAULT_TEMPLATE,
    offer_details: "",
    discount_percentage: 0,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchCampaignSends();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("winback_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignSends = async () => {
    try {
      const { data, error } = await supabase
        .from("winback_campaign_sends")
        .select(`
          *,
          leads (name, email, project_type),
          winback_campaigns (name)
        `)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setCampaignSends(data as any || []);
    } catch (error: any) {
      console.error("Error fetching campaign sends:", error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("winback_campaigns").insert({
        ...formData,
        created_by: user.id,
        discount_percentage: formData.discount_percentage || null,
        offer_details: formData.offer_details || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully.",
      });

      setCreateDialogOpen(false);
      setFormData({
        name: "",
        target_status: "lost",
        trigger_after_days: 30,
        email_subject: "",
        email_template: DEFAULT_TEMPLATE,
        offer_details: "",
        discount_percentage: 0,
      });
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    setSending(true);
    setSelectedCampaignForSend(campaignId);
    try {
      // Get eligible leads
      const { data: eligibleLeads, error: leadsError } = await supabase.rpc(
        "get_eligible_winback_leads",
        { campaign_id_param: campaignId }
      );

      if (leadsError) throw leadsError;

      if (!eligibleLeads || eligibleLeads.length === 0) {
        toast({
          title: "No Eligible Leads",
          description: "There are no leads eligible for this campaign at this time.",
        });
        return;
      }

      // Get campaign details
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (!campaign) throw new Error("Campaign not found");

      // Send emails to each eligible lead
      let successCount = 0;
      for (const lead of eligibleLeads) {
        try {
          const { error: sendError } = await supabase.functions.invoke(
            "send-winback-email",
            {
              body: {
                campaignId: campaign.id,
                leadId: lead.lead_id,
                leadName: lead.lead_name,
                leadEmail: lead.email,
                projectType: lead.project_type,
                emailSubject: campaign.email_subject,
                emailTemplate: campaign.email_template,
                offerDetails: campaign.offer_details,
                discountPercentage: campaign.discount_percentage,
              },
            }
          );

          if (!sendError) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to send to ${lead.lead_name}:`, error);
        }
      }

      toast({
        title: "Campaign Sent",
        description: `Successfully sent ${successCount} out of ${eligibleLeads.length} emails.`,
      });

      fetchCampaignSends();
    } catch (error: any) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send campaign emails.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setSelectedCampaignForSend(null);
    }
  };

  const toggleCampaignStatus = async (campaignId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("winback_campaigns")
        .update({ is_active: !isActive })
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${!isActive ? "activated" : "deactivated"}.`,
      });

      fetchCampaigns();
    } catch (error: any) {
      console.error("Error toggling campaign:", error);
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive",
      });
    }
  };

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
          <BackButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Win-Back Campaigns</h1>
            <p className="text-muted-foreground">
              Re-engage lost and on-hold leads with targeted offers
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Win-Back Campaign</DialogTitle>
                <DialogDescription>
                  Set up an automated email campaign to re-engage leads
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      placeholder="e.g., 30-Day Lost Lead Recovery"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Status</Label>
                    <Select
                      value={formData.target_status}
                      onValueChange={(value: "lost" | "on_hold") =>
                        setFormData({ ...formData, target_status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lost">Lost Leads</SelectItem>
                        <SelectItem value="on_hold">On Hold Leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Send After (Days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.trigger_after_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger_after_days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How many days after status change to send the email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email Subject</Label>
                  <Input
                    placeholder="e.g., We'd Love to Work on Your Project!"
                    value={formData.email_subject}
                    onChange={(e) =>
                      setFormData({ ...formData, email_subject: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Textarea
                    placeholder="Use {leadName}, {projectType} as placeholders"
                    value={formData.email_template}
                    onChange={(e) =>
                      setFormData({ ...formData, email_template: e.target.value })
                    }
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{leadName}"}, {"{projectType}"},{" "}
                    {"{offerDetails}"}, {"{discountPercentage}"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Percentage (Optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.discount_percentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_percentage: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Offer Details (Optional)</Label>
                    <Input
                      placeholder="e.g., Free consultation included"
                      value={formData.offer_details}
                      onChange={(e) =>
                        setFormData({ ...formData, offer_details: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!formData.name || !formData.email_subject}
                  >
                    Create Campaign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="activity">Activity & Results</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No campaigns created yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {campaign.name}
                          <Badge
                            variant={campaign.is_active ? "default" : "secondary"}
                          >
                            {campaign.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Targets {campaign.target_status.replace("_", " ")} leads •{" "}
                          Sends {campaign.trigger_after_days} days after status change
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toggleCampaignStatus(campaign.id, campaign.is_active)
                          }
                        >
                          {campaign.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={
                            sending && selectedCampaignForSend === campaign.id
                          }
                          className="gap-2"
                        >
                          {sending && selectedCampaignForSend === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Now
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Subject:</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.email_subject}
                        </p>
                      </div>
                      {campaign.offer_details && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm font-medium">Special Offer:</p>
                          <p className="text-sm">{campaign.offer_details}</p>
                          {campaign.discount_percentage && (
                            <Badge variant="default" className="mt-2">
                              {campaign.discount_percentage}% OFF
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Activity</CardTitle>
                <CardDescription>
                  Track all sent win-back emails and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignSends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaign emails sent yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignSends.map((send) => (
                        <TableRow key={send.id}>
                          <TableCell className="font-medium">
                            {send.winback_campaigns?.name}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {send.leads?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {send.leads?.project_type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(send.sent_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {send.opened_at ? (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Opened
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Sent
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {send.response_type === "interested" && (
                              <Badge variant="default" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Interested
                              </Badge>
                            )}
                            {send.response_type === "not_interested" && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Interested
                              </Badge>
                            )}
                            {send.response_type === "no_response" && (
                              <span className="text-sm text-muted-foreground">
                                No response
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
