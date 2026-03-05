import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "./InvoicePDF";
import { Suspense } from "react";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    homeowner_name: string;
    homeowner_email: string;
    homeowner_address?: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    terms?: string;
    payment_instructions?: string;
  };
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export const InvoicePreviewDialog = ({ open, onOpenChange, invoice, companyInfo }: InvoicePreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>
            Preview the invoice before sending it to the client
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-lg">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <div className="w-full h-[600px]">
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { margin: 0; padding: 40px; font-family: Arial, sans-serif; }
                        .header { margin-bottom: 30px; }
                        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                        .company-info { font-size: 9px; color: #666; }
                        .invoice-title { font-size: 28px; font-weight: bold; text-align: right; margin-bottom: 20px; }
                        .section { margin-bottom: 20px; display: flex; justify-content: space-between; }
                        .label { font-size: 9px; color: #666; margin-bottom: 3px; }
                        .value { font-size: 10px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th { background-color: #2563eb; color: white; padding: 8px; text-align: left; }
                        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
                        .totals { margin-left: auto; width: 40%; margin-top: 20px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .grand-total { border-top: 2px solid #2563eb; padding-top: 10px; font-weight: bold; font-size: 12px; }
                        .notes { margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 4px; }
                        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 8px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="company-name">${companyInfo.name}</div>
                        ${companyInfo.address ? `<div class="company-info">${companyInfo.address}</div>` : ''}
                        ${companyInfo.phone ? `<div class="company-info">${companyInfo.phone}</div>` : ''}
                        ${companyInfo.email ? `<div class="company-info">${companyInfo.email}</div>` : ''}
                      </div>

                      <div class="invoice-title">INVOICE</div>

                      <div class="section">
                        <div>
                          <div class="label">BILL TO</div>
                          <div class="value">${invoice.homeowner_name}</div>
                          <div style="font-size: 9px;">${invoice.homeowner_email}</div>
                          ${invoice.homeowner_address ? `<div style="font-size: 9px;">${invoice.homeowner_address}</div>` : ''}
                        </div>
                        <div>
                          <div class="total-row">
                            <span class="label">Invoice #:</span>
                            <span class="value">${invoice.invoice_number}</span>
                          </div>
                          <div class="total-row">
                            <span class="label">Invoice Date:</span>
                            <span class="value">${new Date(invoice.invoice_date).toLocaleDateString()}</span>
                          </div>
                          <div class="total-row">
                            <span class="label">Due Date:</span>
                            <span class="value">${new Date(invoice.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th style="width: 50%">Description</th>
                            <th style="width: 15%; text-align: right;">Qty</th>
                            <th style="width: 15%; text-align: right;">Unit Price</th>
                            <th style="width: 20%; text-align: right;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${invoice.line_items.map(item => `
                            <tr>
                              <td>${item.description}</td>
                              <td style="text-align: right;">${item.quantity}</td>
                              <td style="text-align: right;">$${item.unit_price.toFixed(2)}</td>
                              <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>

                      <div class="totals">
                        <div class="total-row">
                          <span>Subtotal:</span>
                          <span>$${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                          <span>Tax (${invoice.tax_rate}%):</span>
                          <span>$${invoice.tax_amount.toFixed(2)}</span>
                        </div>
                        <div class="total-row grand-total">
                          <span>TOTAL:</span>
                          <span>$${invoice.total_amount.toFixed(2)}</span>
                        </div>
                      </div>

                      ${invoice.notes || invoice.terms || invoice.payment_instructions ? `
                        <div class="notes">
                          ${invoice.notes ? `<div><strong>Notes</strong><br/>${invoice.notes}</div>` : ''}
                          ${invoice.terms ? `<div style="margin-top: 10px;"><strong>Terms</strong><br/>${invoice.terms}</div>` : ''}
                          ${invoice.payment_instructions ? `<div style="margin-top: 10px;"><strong>Payment Instructions</strong><br/>${invoice.payment_instructions}</div>` : ''}
                        </div>
                      ` : ''}

                      <div class="footer">
                        Thank you for your business!
                      </div>
                    </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Invoice Preview"
              />
            </div>
          </Suspense>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} companyInfo={companyInfo} />}
            fileName={`invoice-${invoice.invoice_number}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
