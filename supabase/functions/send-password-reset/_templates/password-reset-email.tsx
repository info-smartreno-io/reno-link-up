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

interface PasswordResetEmailProps {
  resetUrl: string
  email: string
}

export const PasswordResetEmail = ({
  resetUrl,
  email,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your SmartReno password</Preview>
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
        
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          We received a request to reset the password for your SmartReno account associated with <strong>{email}</strong>.
        </Text>
        
        <Text style={text}>
          Click the button below to create a new password:
        </Text>
        
        <Section style={buttonContainer}>
          <Button
            style={button}
            href={resetUrl}
          >
            Reset Password
          </Button>
        </Section>
        
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        
        <Link href={resetUrl} style={link}>
          {resetUrl}
        </Link>
        
        <Section style={warningBox}>
          <Text style={warningTitle}>
            🔒 Security Notice
          </Text>
          <Text style={warningText}>
            This password reset link will expire in 1 hour for your security.
          </Text>
          <Text style={warningText}>
            If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.
          </Text>
        </Section>
        
        <Section style={tipsBox}>
          <Text style={tipsTitle}>
            <strong>Password Security Tips</strong>
          </Text>
          <ul style={list}>
            <li style={listItem}>Use at least 8 characters</li>
            <li style={listItem}>Include a mix of letters, numbers, and symbols</li>
            <li style={listItem}>Avoid using personal information</li>
            <li style={listItem}>Don't reuse passwords from other accounts</li>
          </ul>
        </Section>
        
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

export default PasswordResetEmail

// SmartReno brand colors
const brandBlue = '#2952A3'  // Primary blue from --primary: 216 67% 32%
const brandAccent = '#4169E1' // Accent blue from --accent: 221 83% 53%
const textDark = '#1E293B'   // Foreground from --foreground: 215 20% 15%
const textMuted = '#64748B'  // Muted foreground
const warningBg = '#FEF3C7'  // Light yellow for security notice
const warningBorder = '#F59E0B' // Orange border

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

const warningBox = {
  backgroundColor: warningBg,
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: `2px solid ${warningBorder}`,
}

const warningTitle = {
  color: textDark,
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const warningText = {
  color: textDark,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const tipsBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid #E2E8F0',
}

const tipsTitle = {
  color: textDark,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px',
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
