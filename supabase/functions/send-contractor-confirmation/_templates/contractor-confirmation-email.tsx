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

interface ContractorConfirmationEmailProps {
  companyName: string
  contactName: string
  trackingNumber: string
  submittedDate: string
}

export const ContractorConfirmationEmail = ({
  companyName,
  contactName,
  trackingNumber,
  submittedDate,
}: ContractorConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your SmartReno contractor application has been received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application Received!</Heading>
        
        <Text style={text}>
          Hi {contactName},
        </Text>
        
        <Text style={text}>
          Thank you for applying to join the SmartReno contractor network. We've received your application for <strong>{companyName}</strong> and are excited to review it.
        </Text>

        <Section style={trackingSection}>
          <Text style={trackingLabel}>Your Tracking Number:</Text>
          <Text style={trackingNumber}>{trackingNumber}</Text>
          <Text style={trackingHint}>
            Save this number to track your application status
          </Text>
        </Section>

        <Hr style={hr} />

        <Section>
          <Heading style={h2}>What Happens Next?</Heading>
          
          <Section style={timelineItem}>
            <Text style={timelineStep}>✓ Step 1: Application Received</Text>
            <Text style={timelineDescription}>
              We've received your application and all documents
            </Text>
            <Text style={timelineTime}>Completed - Just now</Text>
          </Section>

          <Section style={timelineItem}>
            <Text style={timelineStep}>⏳ Step 2: Review in Progress</Text>
            <Text style={timelineDescription}>
              Our team will review your credentials and experience
            </Text>
            <Text style={timelineTime}>Within 24-48 hours</Text>
          </Section>

          <Section style={timelineItem}>
            <Text style={timelineStep}>📧 Step 3: Decision & Notification</Text>
            <Text style={timelineDescription}>
              You'll receive an email with our decision and next steps
            </Text>
            <Text style={timelineTime}>2-3 business days</Text>
          </Section>

          <Section style={timelineItem}>
            <Text style={timelineStep}>🚀 Step 4: Onboarding (If Approved)</Text>
            <Text style={timelineDescription}>
              Get access to the platform and start receiving leads
            </Text>
            <Text style={timelineTime}>Within 1 week</Text>
          </Section>
        </Section>

        <Hr style={hr} />

        <Section style={detailsSection}>
          <Heading style={h3}>Application Details</Heading>
          <Text style={detailText}>
            <strong>Company:</strong> {companyName}
          </Text>
          <Text style={detailText}>
            <strong>Submitted:</strong> {submittedDate}
          </Text>
          <Text style={detailText}>
            <strong>Expected Response:</strong> Within 2-3 business days
          </Text>
        </Section>

        <Section style={helpSection}>
          <Text style={text}>
            <strong>Need Help?</strong>
          </Text>
          <Text style={text}>
            If you have any questions about your application, please contact us at{' '}
            <Link href="mailto:contractors@smartreno.com" style={link}>
              contractors@smartreno.com
            </Link>
            {' '}and reference your tracking number: <strong>{trackingNumber}</strong>
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          <Link href="https://smartreno.com" target="_blank" style={link}>
            SmartReno
          </Link>
          <br />
          Connecting quality contractors with homeowners across North Jersey
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ContractorConfirmationEmail

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
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
  padding: '0',
}

const h3 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const trackingSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 40px',
  textAlign: 'center' as const,
}

const trackingLabel = {
  color: '#666',
  fontSize: '12px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const trackingNumber = {
  color: '#2563eb',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  fontFamily: 'monospace',
}

const trackingHint = {
  color: '#666',
  fontSize: '12px',
  margin: '8px 0 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const timelineItem = {
  margin: '0 40px 20px',
}

const timelineStep = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const timelineDescription = {
  color: '#666',
  fontSize: '13px',
  margin: '0 0 4px',
  lineHeight: '20px',
}

const timelineTime = {
  color: '#2563eb',
  fontSize: '12px',
  margin: '0',
  fontWeight: '500',
}

const detailsSection = {
  margin: '0 40px',
}

const detailText = {
  color: '#333',
  fontSize: '14px',
  margin: '8px 0',
}

const helpSection = {
  margin: '24px 40px',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  textAlign: 'center' as const,
}
