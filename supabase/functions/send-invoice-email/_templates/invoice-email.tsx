import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface InvoiceEmailProps {
  invoice_number: string;
  homeowner_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  company_name: string;
  company_email?: string;
  view_invoice_url?: string;
}

export const InvoiceEmail = ({
  invoice_number,
  homeowner_name,
  invoice_date,
  due_date,
  total_amount,
  company_name,
  company_email,
  view_invoice_url,
}: InvoiceEmailProps) => (
  <Html>
    <Head />
    <Preview>Invoice {invoice_number} from {company_name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{company_name}</Heading>
        
        <Text style={text}>
          Dear {homeowner_name},
        </Text>
        
        <Text style={text}>
          Thank you for your business! Please find attached your invoice for the work completed.
        </Text>

        <Section style={invoiceBox}>
          <Row>
            <Column style={invoiceLabel}>Invoice Number:</Column>
            <Column style={invoiceValue}>{invoice_number}</Column>
          </Row>
          <Row>
            <Column style={invoiceLabel}>Invoice Date:</Column>
            <Column style={invoiceValue}>{new Date(invoice_date).toLocaleDateString()}</Column>
          </Row>
          <Row>
            <Column style={invoiceLabel}>Due Date:</Column>
            <Column style={invoiceValue}>{new Date(due_date).toLocaleDateString()}</Column>
          </Row>
          <Row style={{ marginTop: '16px' }}>
            <Column style={invoiceLabel}>Total Amount:</Column>
            <Column style={totalAmount}>${total_amount.toFixed(2)}</Column>
          </Row>
        </Section>

        {view_invoice_url && (
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link
              href={view_invoice_url}
              target="_blank"
              style={button}
            >
              View Invoice Online
            </Link>
          </Section>
        )}

        <Hr style={hr} />

        <Text style={text}>
          The invoice is attached to this email as a PDF. If you have any questions about this invoice, 
          please don't hesitate to contact us.
        </Text>

        <Text style={footer}>
          Best regards,
          <br />
          {company_name}
          {company_email && (
            <>
              <br />
              <Link href={`mailto:${company_email}`} style={link}>
                {company_email}
              </Link>
            </>
          )}
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InvoiceEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#2563eb',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const invoiceBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 40px',
};

const invoiceLabel = {
  color: '#666',
  fontSize: '14px',
  paddingBottom: '8px',
};

const invoiceValue = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '600',
  paddingBottom: '8px',
  textAlign: 'right' as const,
};

const totalAmount = {
  color: '#2563eb',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'right' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
};
