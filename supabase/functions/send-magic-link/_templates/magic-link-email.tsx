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

interface MagicLinkEmailProps {
  magicLink: string
  email: string
}

export const MagicLinkEmail = ({
  magicLink,
  email,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Sign in to SmartReno with one click</Preview>
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
        
        <Heading style={h1}>Sign In to SmartReno</Heading>
        
        <Text style={text}>
          Click the button below to securely sign in to your SmartReno account with <strong>{email}</strong>.
        </Text>
        
        <Text style={text}>
          No password needed – just one click and you're in!
        </Text>
        
        <Section style={buttonContainer}>
          <Button
            style={button}
            href={magicLink}
          >
            Sign In to SmartReno
          </Button>
        </Section>
        
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        
        <Link href={magicLink} style={link}>
          {magicLink}
        </Link>
        
        <Section style={infoBox}>
          <Text style={infoTitle}>
            ✨ What is a magic link?
          </Text>
          <Text style={infoText}>
            Magic links are a secure, passwordless way to sign in. This link is unique to you and expires after one use or 1 hour for your security.
          </Text>
          <Text style={infoText}>
            Simply click the link above, and you'll be automatically signed in to your SmartReno account – no password required!
          </Text>
        </Section>
        
        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>
            <strong>Why use magic links?</strong>
          </Text>
          <ul style={list}>
            <li style={listItem}>🔒 More secure than passwords</li>
            <li style={listItem}>⚡ Faster sign-in experience</li>
            <li style={listItem}>🧠 No passwords to remember</li>
            <li style={listItem}>📱 Works on all your devices</li>
          </ul>
        </Section>
        
        <Section style={warningBox}>
          <Text style={warningText}>
            <strong>Security Notice:</strong> If you didn't request this sign-in link, please ignore this email. Your account remains secure.
          </Text>
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

export default MagicLinkEmail

// SmartReno brand colors
const brandBlue = '#2952A3'  // Primary blue from --primary: 216 67% 32%
const brandAccent = '#4169E1' // Accent blue from --accent: 221 83% 53%
const textDark = '#1E293B'   // Foreground from --foreground: 215 20% 15%
const textMuted = '#64748B'  // Muted foreground
const infoBg = '#EFF6FF'     // Light blue for info box
const infoBorder = '#3B82F6' // Blue border

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
  padding: '14px 40px',
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
  backgroundColor: infoBg,
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: `2px solid ${infoBorder}`,
}

const infoTitle = {
  color: textDark,
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const infoText = {
  color: textDark,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const benefitsBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  border: '1px solid #E2E8F0',
}

const benefitsTitle = {
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

const warningBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
  border: '1px solid #F59E0B',
}

const warningText = {
  color: textDark,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
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
