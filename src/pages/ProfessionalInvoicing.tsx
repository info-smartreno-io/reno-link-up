import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, FileText, Send, ArrowLeft, Loader2, Eye, DollarSign } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoicePreviewDialog } from "@/components/invoices/InvoicePreviewDialog";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";

export default function ProfessionalInvoicing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch user profile for company info
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser(data.user);
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .single()
          .then(({ data }) => setUserProfile(data));
      }
    });
  }, []);

  const { data: invoices, refetch } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.homeowner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "outline",
      paid: "default",
      partially_paid: "outline",
      overdue: "destructive",
      cancelled: "secondary",
    };
    const labels: Record<string, string> = {
      partially_paid: "Partially Paid",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    try {
      // Get user profile for company info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceId,
          companyName: profile?.full_name || "Your Company",
          companyEmail: user.email,
        },
      });

      if (error) throw error;

      // Sync to QuickBooks (non-blocking)
      supabase.functions.invoke('quickbooks-push-invoice', {
        body: { invoiceId },
      }).then(({ data, error: qbError }) => {
        if (qbError) {
          console.error('QuickBooks sync error:', qbError);
        } else if (data?.synced) {
          toast({
            title: "Synced to QuickBooks",
            description: "Invoice synced to QuickBooks successfully",
          });
        }
      });

      toast({
        title: "Invoice sent",
        description: "The invoice has been sent to the client successfully.",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invoice. Please try again.",
      });
    } finally {
      setSendingInvoiceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage invoices for your clients
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Invoices</CardTitle>
            <CardDescription>View and manage your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.homeowner_name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.homeowner_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">${invoice.amount_paid.toFixed(2)}</span>
                      {invoice.amount_paid < invoice.total_amount && (
                        <span className="text-muted-foreground text-sm ml-1">
                          / ${invoice.total_amount.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setPreviewInvoice(invoice)}
                          title="Preview Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setPaymentInvoice(invoice)}
                          disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                          title="Record Payment"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={invoice.status !== 'draft' || sendingInvoiceId === invoice.id}
                          onClick={() => handleSendInvoice(invoice.id)}
                          title="Send Invoice"
                        >
                          {sendingInvoiceId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredInvoices || filteredInvoices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />

      {previewInvoice && userProfile && currentUser && (
        <InvoicePreviewDialog
          open={!!previewInvoice}
          onOpenChange={(open) => !open && setPreviewInvoice(null)}
          invoice={previewInvoice}
          companyInfo={{
            name: userProfile.full_name || "Your Company",
            email: currentUser.email,
          }}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
