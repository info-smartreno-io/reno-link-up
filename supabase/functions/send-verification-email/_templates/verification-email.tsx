import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface VerificationEmailProps {
  confirmationUrl: string
  email: string
}

export const VerificationEmail = ({
  confirmationUrl,
  email,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your SmartReno account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://pscsnsgvfjcbldomnstb.supabase.co/storage/v1/object/public/applications/smartreno-logo.png"
            width="180"
            height="auto"
            alt="SmartReno Logo"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Welcome to SmartReno!</Heading>
        
        <Text style={text}>
          Thank you for signing up. We're excited to help you transform your home renovation experience.
        </Text>
        
        <Text style={text}>
          To get started, please verify your email address by clicking the button below:
        </Text>
        
        <Section style={buttonContainer}>
          <Button
            style={button}
            href={confirmationUrl}
          >
            Verify Email Address
          </Button>
        </Section>
        
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        
        <Link href={confirmationUrl} style={link}>
          {confirmationUrl}
        </Link>
        
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Why verify?</strong>
          </Text>
          <Text style={infoText}>
            Email verification helps us ensure the security of your account and enables you to:
          </Text>
          <ul style={list}>
            <li style={listItem}>Access your personalized dashboard</li>
            <li style={listItem}>Connect with verified contractors and professionals</li>
            <li style={listItem}>Receive important project updates</li>
            <li style={listItem}>Manage your renovation projects</li>
          </ul>
        </Section>
        
        <Text style={smallText}>
          This verification link will expire in 24 hours. If you didn't create an account with SmartReno, you can safely ignore this email.
        </Text>
        
        <Section style={footer}>
          <Text style={footerText}>
            Need help? Contact us at{' '}
            <Link href="mailto:info@smartreno.io" style={footerLink}>
              info@smartreno.io
            </Link>
          </Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} SmartReno. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

// SmartReno brand colors
const brandBlue = '#2952A3'  // Primary blue from --primary: 216 67% 32%
const brandAccent = '#4169E1' // Accent blue from --accent: 221 83% 53%
const textDark = '#1E293B'   // Foreground from --foreground: 215 20% 15%
const textMuted = '#64748B'  // Muted foreground

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: brandBlue,
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
  textAlign: 'center' as const,
  lineHeight: '1.2',
}

const text = {
  color: textDark,
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: brandBlue,
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.4',
}

const link = {
  color: brandAccent,
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  display: 'block',
  margin: '16px 0',
}

const infoBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid #E2E8F0',
}

const infoText = {
  color: textDark,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const list = {
  margin: '12px 0',
  paddingLeft: '20px',
}

const listItem = {
  color: textDark,
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '8px',
}

const smallText = {
  color: textMuted,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const footer = {
  borderTop: '1px solid #E2E8F0',
  marginTop: '40px',
  paddingTop: '24px',
}

const footerText = {
  color: textMuted,
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '8px 0',
}

const footerLink = {
  color: brandAccent,
  textDecoration: 'underline',
}
