import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
  Hr,
} from '@react-email/components'
import React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export default function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        {/* Header */}
        <Section style={header}>
          <Container style={headerInner}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td>
                    {/* Logo mark SVG inline */}
                    <table style={{ borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingRight: '10px', verticalAlign: 'middle' }}>
                            <div style={logoMark}>
                              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="16" cy="16" r="14" stroke="#00b4d8" strokeWidth="2.5" fill="none" />
                                <path d="M10 16 L16 10 L22 16 L16 22 Z" fill="#00b4d8" />
                              </svg>
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <Text style={logoText}>COSWORTH RETURNS</Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </Container>
        </Section>

        {/* Content */}
        <Container style={container}>
          {children}
        </Container>

        {/* Footer */}
        <Section style={footerSection}>
          <Container style={footerInner}>
            <Hr style={footerHr} />
            <Text style={footerText}>
              Cosworth Electronics Ltd, Brookfield Technology Centre, Cambridge CB24 8PS
            </Text>
            <Text style={footerSubText}>
              This is an automated notification from the Cosworth Returns Portal.
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: 'Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const header: React.CSSProperties = {
  backgroundColor: '#003057',
  padding: '20px 0',
}

const headerInner: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 24px',
}

const logoMark: React.CSSProperties = {
  display: 'inline-block',
}

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  letterSpacing: '0.08em',
  margin: 0,
  fontFamily: 'Arial, sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  padding: '40px',
}

const footerSection: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  padding: '0 0 24px',
}

const footerInner: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 24px',
}

const footerHr: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '0 0 16px',
}

const footerText: React.CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 4px',
  fontFamily: 'Arial, sans-serif',
}

const footerSubText: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  margin: 0,
  fontFamily: 'Arial, sans-serif',
}
