import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface CustomerResponseReceivedProps {
  staffName: string
  caseNumber: string
  customerName: string
  responseContent: string
  caseUrl: string
}

export default function CustomerResponseReceived({
  staffName,
  caseNumber,
  customerName,
  responseContent,
  caseUrl,
}: CustomerResponseReceivedProps) {
  return (
    <EmailLayout preview={`Customer responded on case ${caseNumber}`}>
      <Heading style={h1}>Customer Response Received</Heading>
      <Text style={greeting}>Hi {staffName},</Text>
      <Text style={body}>
        A customer has responded to your hold query on case <strong>{caseNumber}</strong>. The hold has been automatically cleared and work can resume.
      </Text>

      <Section style={metaRow}>
        <Text style={metaText}><strong>Customer:</strong> {customerName}</Text>
        <Text style={metaText}><strong>Case:</strong> {caseNumber}</Text>
      </Section>

      <Section style={responseBox}>
        <Text style={responseLabel}>Customer Response</Text>
        <Text style={responseText}>{responseContent}</Text>
      </Section>

      <Hr style={hr} />

      <Button href={caseUrl} style={button}>
        View Case
      </Button>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const metaRow: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '12px 16px', margin: '0 0 16px' }
const metaText: React.CSSProperties = { fontSize: '13px', color: '#475569', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const responseBox: React.CSSProperties = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', margin: '0 0 0' }
const responseLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#15803d', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }
const responseText: React.CSSProperties = { fontSize: '14px', color: '#0f172a', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const button: React.CSSProperties = { backgroundColor: '#0066cc', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block', fontFamily: 'Arial, sans-serif' }
