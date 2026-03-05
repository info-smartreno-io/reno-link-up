import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, DollarSign, Bell, MoreHorizontal, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoicePreviewDialog } from "@/components/invoices/InvoicePreviewDialog";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";
import { AdminSideNav } from "@/components/AdminSideNav";
import { SettingsDropdown } from "@/components/SettingsDropdown";

export default function AdminInvoicing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const { data: invoices, refetch } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
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
    const styles: Record<string, string> = {
      draft: "bg-gray-200 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      paid: "bg-green-100 text-green-700",
      partially_paid: "bg-blue-100 text-blue-700",
      overdue: "bg-red-100 text-red-700",
      cancelled: "bg-gray-200 text-gray-700",
    };
    const labels: Record<string, string> = {
      partially_paid: "Partially Paid",
      draft: "Draft",
      sent: "Sent",
      paid: "Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
    };
    return (
      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-200 text-gray-700"}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceId,
          companyName: "SmartReno",
          companyEmail: "billing@smartreno.com",
          companyAddress: "North Jersey, NJ",
          companyPhone: "(555) 123-4567",
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

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-reminders');

      if (error) throw error;

      toast({
        title: "Reminders sent",
        description: `${data.remindersSent || 0} payment reminder(s) sent successfully`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reminders",
      });
    } finally {
      setSendingReminders(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNav />
      
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-bold">Invoicing</h1>
            <SettingsDropdown userRole="admin" />
          </div>
        </header>

        <main className="p-6">
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSendReminders}
                  disabled={sendingReminders}
                >
                  {sendingReminders ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="mr-2 h-4 w-4" />
                  )}
                  Send Payment Reminders
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold text-slate-800">All Invoices</CardTitle>
              <CardDescription className="sr-only">Manage all invoices across your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="text-sm font-medium text-slate-500">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>QuickBooks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices?.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.homeowner_name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.homeowner_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="font-medium">${invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">${invoice.amount_paid.toFixed(2)}</span>
                        {invoice.amount_paid < invoice.total_amount && (
                          <span className="text-muted-foreground text-sm ml-1">
                            / ${invoice.total_amount.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.quickbooks_id ? (
                          <div className="flex items-center text-green-600 gap-1 text-sm">
                            <RefreshCw className="w-4 h-4" /> Synced
                          </div>
                        ) : (
                          <div className="flex items-center text-slate-400 gap-1 text-sm">
                            <RefreshCw className="w-4 h-4" /> Not Synced
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                              <Eye className="w-4 h-4 mr-2" /> Preview Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                              <Download className="w-4 h-4 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              disabled={invoice.status !== 'draft' || sendingInvoiceId === invoice.id}
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              {sendingInvoiceId === invoice.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" /> Send to Client
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                              onClick={() => setPaymentInvoice(invoice)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredInvoices || filteredInvoices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />

      {previewInvoice && (
        <InvoicePreviewDialog
          open={!!previewInvoice}
          onOpenChange={(open) => !open && setPreviewInvoice(null)}
          invoice={previewInvoice}
          companyInfo={{
            name: "SmartReno",
            address: "North Jersey, NJ",
            phone: "(555) 123-4567",
            email: "billing@smartreno.com",
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
