import { Document, Page, Text, View, StyleSheet, PDFViewer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: "#666",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "white",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  col1: { width: "50%" },
  col2: { width: "15%", textAlign: "right" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "20%", textAlign: "right" },
  totalsSection: {
    marginLeft: "auto",
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#2563eb",
    fontWeight: "bold",
    fontSize: 12,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#666",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface InvoicePDFProps {
  invoice: {
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

export const InvoicePDF = ({ invoice, companyInfo }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logo}>{companyInfo.name}</Text>
        {companyInfo.address && <Text style={styles.companyInfo}>{companyInfo.address}</Text>}
        {companyInfo.phone && <Text style={styles.companyInfo}>{companyInfo.phone}</Text>}
        {companyInfo.email && <Text style={styles.companyInfo}>{companyInfo.email}</Text>}
      </View>

      <Text style={styles.invoiceTitle}>INVOICE</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>BILL TO</Text>
            <Text style={styles.value}>{invoice.homeowner_name}</Text>
            <Text style={{ fontSize: 9 }}>{invoice.homeowner_email}</Text>
            {invoice.homeowner_address && <Text style={{ fontSize: 9 }}>{invoice.homeowner_address}</Text>}
          </View>
          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice #:</Text>
              <Text style={styles.value}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice Date:</Text>
              <Text style={styles.value}>{new Date(invoice.invoice_date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>{new Date(invoice.due_date).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Unit Price</Text>
          <Text style={styles.col4}>Amount</Text>
        </View>
        {invoice.line_items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{item.description}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>${item.unit_price.toFixed(2)}</Text>
            <Text style={styles.col4}>${item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>${invoice.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax ({invoice.tax_rate}%):</Text>
          <Text>${invoice.tax_amount.toFixed(2)}</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text>TOTAL:</Text>
          <Text>${invoice.total_amount.toFixed(2)}</Text>
        </View>
      </View>

      {(invoice.notes || invoice.terms || invoice.payment_instructions) && (
        <View style={styles.notes}>
          {invoice.notes && (
            <>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text>{invoice.notes}</Text>
            </>
          )}
          {invoice.terms && (
            <>
              <Text style={[styles.notesTitle, { marginTop: 10 }]}>Terms</Text>
              <Text>{invoice.terms}</Text>
            </>
          )}
          {invoice.payment_instructions && (
            <>
              <Text style={[styles.notesTitle, { marginTop: 10 }]}>Payment Instructions</Text>
              <Text>{invoice.payment_instructions}</Text>
            </>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);

export const InvoicePDFViewer = (props: InvoicePDFProps) => (
  <PDFViewer width="100%" height="600px">
    <InvoicePDF {...props} />
  </PDFViewer>
);
