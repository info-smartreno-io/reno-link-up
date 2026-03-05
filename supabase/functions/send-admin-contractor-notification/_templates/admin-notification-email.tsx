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
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface AdminNotificationEmailProps {
  companyName: string
  contactName: string
  email: string
  phone: string
  trackingNumber: string
  productCategories: string
  serviceAreas: string
  hasLicense: boolean
  hasInsurance: boolean
  portfolioCount: number
  submittedDate: string
}

export const AdminNotificationEmail = ({
  companyName,
  contactName,
  email,
  phone,
  trackingNumber,
  productCategories,
  serviceAreas,
  hasLicense,
  hasInsurance,
  portfolioCount,
  submittedDate,
}: AdminNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New contractor application from {companyName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔔 New Contractor Application</Heading>
        
        <Text style={alertText}>
          A new contractor has submitted an application to join the SmartReno network.
        </Text>

        <Section style={highlightBox}>
          <Text style={trackingLabel}>Tracking Number</Text>
          <Text style={trackingNumber}>{trackingNumber}</Text>
        </Section>

        <Hr style={hr} />

        <Section>
          <Heading style={h2}>Applicant Information</Heading>
          
          <Section style={detailSection}>
            <Text style={detailLabel}>Company Name:</Text>
            <Text style={detailValue}>{companyName}</Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Contact Person:</Text>
            <Text style={detailValue}>{contactName}</Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Email:</Text>
            <Text style={detailValue}>
              <Link href={`mailto:${email}`} style={link}>{email}</Link>
            </Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Phone:</Text>
            <Text style={detailValue}>
              <Link href={`tel:${phone}`} style={link}>{phone}</Link>
            </Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Services Offered:</Text>
            <Text style={detailValue}>{productCategories}</Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Service Areas:</Text>
            <Text style={detailValue}>{serviceAreas}</Text>
          </Section>

          <Section style={detailSection}>
            <Text style={detailLabel}>Submitted Date:</Text>
            <Text style={detailValue}>{submittedDate}</Text>
          </Section>
        </Section>

        <Hr style={hr} />

        <Section>
          <Heading style={h2}>Documents Submitted</Heading>
          
          <Section style={documentsGrid}>
            <Text style={documentItem}>
              {hasLicense ? '✅' : '❌'} Business License
            </Text>
            <Text style={documentItem}>
              {hasInsurance ? '✅' : '❌'} Insurance Certificate
            </Text>
            <Text style={documentItem}>
              {portfolioCount > 0 ? '✅' : '❌'} Portfolio ({portfolioCount} images)
            </Text>
          </Section>
        </Section>

        <Hr style={hr} />

        <Section style={ctaSection}>
          <Text style={ctaText}>
            <strong>Action Required:</strong> Review this application in the admin dashboard
          </Text>
          <Link
            href="https://smartreno.lovable.app/admin/vendors"
            style={button}
          >
            Review Application
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This is an automated notification from SmartReno Contractor Application System
        </Text>
      </Container>
    </Body>
  </Html>
)

export default AdminNotificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const h2 = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
  padding: '0 40px',
}

const alertText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 24px',
  padding: '0 40px',
}

const highlightBox = {
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
  textAlign: 'center' as const,
}

const trackingLabel = {
  color: '#1e40af',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const trackingNumber = {
  color: '#1e3a8a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  fontFamily: 'monospace',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const detailSection = {
  margin: '0 40px 12px',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 4px',
  fontWeight: '500',
}

const detailValue = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
}

const documentsGrid = {
  margin: '0 40px',
}

const documentItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '8px 0',
}

const ctaSection = {
  margin: '24px 40px',
  textAlign: 'center' as const,
}

const ctaText = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0 0 16px',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 auto',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
