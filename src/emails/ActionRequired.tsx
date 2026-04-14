import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface ActionRequiredProps {
  customerName: string
  caseNumber: string
  question: string
  responseUrl: string
  expiresAt: string
}

export default function ActionRequired({
  customerName,
  caseNumber,
  question,
  responseUrl,
  expiresAt,
}: ActionRequiredProps) {
  return (
    <EmailLayout preview={`Action required on your case ${caseNumber} — please respond`}>
      <Heading style={h1}>Your Response is Required</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Your repair case <strong>{caseNumber}</strong> requires your confirmation before we can continue. Please read the message from our team below and respond as soon as possible.
      </Text>

      <Section style={questionBox}>
        <Text style={questionLabel}>Message from Cosworth Returns Team</Text>
        <Text style={questionText}>{question}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Button href={responseUrl} style={button}>
          Respond Now
        </Button>
      </Section>

      <Hr style={hr} />

      <Section style={expiryNote}>
        <Text style={expiryText}>
          ⏱ This response link expires on <strong>{expiresAt}</strong>. After this date, please log in to the portal to respond directly.
        </Text>
      </Section>

      <Text style={footer}>
        Or log in to respond at the Cosworth Returns Portal — navigate to your case and use the response form on the case detail page.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const questionBox: React.CSSProperties = { backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '20px', margin: '0 0 8px' }
const questionLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#b45309', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'Arial, sans-serif' }
const questionText: React.CSSProperties = { fontSize: '15px', color: '#78350f', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const button: React.CSSProperties = { backgroundColor: '#f59e0b', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', textDecoration: 'none', display: 'inline-block', fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const expiryNote: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '12px 16px', margin: '0 0 16px' }
const expiryText: React.CSSProperties = { fontSize: '13px', color: '#64748b', margin: 0, fontFamily: 'Arial, sans-serif' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
