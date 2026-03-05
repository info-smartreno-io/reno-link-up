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
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface WarrantyNotificationEmailProps {
  claimNumber: string;
  homeownerName: string;
  status: string;
  issueTitle: string;
  nextSteps?: string;
  scheduledDate?: string;
  resolutionSummary?: string;
}

export const WarrantyNotificationEmail = ({
  claimNumber,
  homeownerName,
  status,
  issueTitle,
  nextSteps,
  scheduledDate,
  resolutionSummary,
}: WarrantyNotificationEmailProps) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'new':
        return {
          title: 'Warranty Claim Received',
          message: 'We have received your warranty claim and our team will review it shortly.',
          color: '#3b82f6',
        };
      case 'in_review':
        return {
          title: 'Claim Under Review',
          message: 'Your warranty claim is currently being reviewed by our team.',
          color: '#f59e0b',
        };
      case 'info_requested':
        return {
          title: 'Additional Information Needed',
          message: 'We need more information to process your warranty claim.',
          color: '#ef4444',
        };
      case 'scheduled_inspection':
        return {
          title: 'Inspection Scheduled',
          message: 'An inspection has been scheduled for your warranty claim.',
          color: '#8b5cf6',
        };
      case 'awaiting_contractor':
        return {
          title: 'Awaiting Contractor',
          message: 'Your claim has been assigned to a contractor for review.',
          color: '#f59e0b',
        };
      case 'in_repair':
        return {
          title: 'Repair in Progress',
          message: 'Work is currently in progress to resolve your warranty issue.',
          color: '#3b82f6',
        };
      case 'resolved':
        return {
          title: 'Claim Resolved',
          message: 'Your warranty claim has been successfully resolved.',
          color: '#10b981',
        };
      case 'denied':
        return {
          title: 'Claim Decision',
          message: 'Your warranty claim has been reviewed.',
          color: '#ef4444',
        };
      default:
        return {
          title: 'Warranty Claim Update',
          message: 'There has been an update to your warranty claim.',
          color: '#6b7280',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <Html>
      <Head />
      <Preview>{statusInfo.title} - {claimNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={{ ...header, borderLeftColor: statusInfo.color }}>
            <Heading style={h1}>SmartReno Warranty</Heading>
            <Text style={statusBadge}>{statusInfo.title}</Text>
          </div>

          <Section style={content}>
            <Text style={greeting}>Hello {homeownerName},</Text>
            
            <Text style={paragraph}>{statusInfo.message}</Text>

            <div style={claimBox}>
              <Text style={claimLabel}>Claim Number</Text>
              <Text style={claimNumberStyle as any}>{claimNumber}</Text>
              <Hr style={divider} />
              <Text style={claimLabel}>Issue</Text>
              <Text style={paragraph}>{issueTitle}</Text>
            </div>

            {scheduledDate && (
              <div style={infoBox}>
                <Text style={infoLabel}>📅 Scheduled Date</Text>
                <Text style={paragraph}>{new Date(scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</Text>
              </div>
            )}

            {resolutionSummary && (
              <div style={infoBox}>
                <Text style={infoLabel}>Resolution Details</Text>
                <Text style={paragraph}>{resolutionSummary}</Text>
              </div>
            )}

            {nextSteps && (
              <div style={infoBox}>
                <Text style={infoLabel}>Next Steps</Text>
                <Text style={paragraph}>{nextSteps}</Text>
              </div>
            )}

            <Hr style={divider} />

            <Text style={paragraph}>
              You can view the full details of your claim and upload additional information in your homeowner portal.
            </Text>

            <Link href="https://smartreno.com/homeowner-portal" style={button}>
              View Claim Details
            </Link>

            <Text style={footerText}>
              If you have any questions, please don't hesitate to contact us. We're here to help!
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from SmartReno. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              SmartReno - Renovations, Simplified
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WarrantyNotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 40px',
  borderLeft: '4px solid #3b82f6',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 8px',
};

const statusBadge = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const content = {
  padding: '0 40px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1f2937',
  fontWeight: '500',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#374151',
  margin: '0 0 12px',
};

const claimBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const claimLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const claimNumberStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 16px',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
};

const infoLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '24px 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const footer = {
  padding: '0 40px',
  marginTop: '32px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '8px 0',
};
