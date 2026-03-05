import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  material_cost: number;
  labor_cost: number;
  total_cost: number;
}

interface EstimatePDFProps {
  estimateNumber: string;
  clientName: string;
  projectName: string;
  projectDescription?: string;
  validUntil?: string;
  lineItems: LineItem[];
  materialsCost: number;
  laborCost: number;
  permitsFees: number;
  contingency: number;
  notes?: string;
  terms?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  logo: {
    width: 150,
    height: 40,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
    backgroundColor: '#f1f5f9',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '70%',
    color: '#0f172a',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '40%' },
  col2: { width: '12%', textAlign: 'right' },
  col3: { width: '12%', textAlign: 'right' },
  col4: { width: '12%', textAlign: 'right' },
  col5: { width: '12%', textAlign: 'right' },
  col6: { width: '12%', textAlign: 'right' },
  summary: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '50%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#475569',
  },
  summaryValue: {
    color: '#0f172a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeft: 3,
    borderLeftColor: '#f59e0b',
  },
  terms: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f1f5f9',
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
});

export const EstimatePDF = ({
  estimateNumber,
  clientName,
  projectName,
  projectDescription,
  validUntil,
  lineItems,
  materialsCost,
  laborCost,
  permitsFees,
  contingency,
  notes,
  terms,
}: EstimatePDFProps) => {
  const grandTotal = materialsCost + laborCost + permitsFees + contingency;
  const currentDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>SmartReno</Text>
          <Text style={styles.companyInfo}>Professional Home Renovation Services</Text>
          <Text style={styles.companyInfo}>North Jersey | info@smartreno.com | (555) 123-4567</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>PROJECT ESTIMATE</Text>

        {/* Estimate Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Estimate #:</Text>
            <Text style={styles.value}>{estimateNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{currentDate}</Text>
          </View>
          {validUntil && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text style={styles.value}>{validUntil}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Project:</Text>
            <Text style={styles.value}>{projectName}</Text>
          </View>
          {projectDescription && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{projectDescription}</Text>
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>PROJECT BREAKDOWN</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit</Text>
            <Text style={styles.col4}>Materials</Text>
            <Text style={styles.col5}>Labor</Text>
            <Text style={styles.col6}>Total</Text>
          </View>

          {lineItems.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unit}</Text>
              <Text style={styles.col4}>${item.material_cost.toFixed(2)}</Text>
              <Text style={styles.col5}>${item.labor_cost.toFixed(2)}</Text>
              <Text style={styles.col6}>${item.total_cost.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Cost Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Materials:</Text>
            <Text style={styles.summaryValue}>${materialsCost.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Labor:</Text>
            <Text style={styles.summaryValue}>${laborCost.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Permits & Fees:</Text>
            <Text style={styles.summaryValue}>${permitsFees.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contingency:</Text>
            <Text style={styles.summaryValue}>${contingency.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TOTAL ESTIMATE</Text>
            <Text>${grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* Terms */}
        {terms && (
          <View style={styles.terms}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Terms & Conditions:</Text>
            <Text>{terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This estimate is valid for 30 days from the date of issue.</Text>
          <Text>Thank you for considering SmartReno for your renovation project!</Text>
        </View>
      </Page>
    </Document>
  );
};
