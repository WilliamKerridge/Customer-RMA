import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface HoldStateChangedProps {
  customerName: string
  caseNumber: string
  holdLabel: string
  caseUrl: string
}

export default function HoldStateChanged({
  customerName,
  caseNumber,
  holdLabel,
  caseUrl,
}: HoldStateChangedProps) {
  return (
    <EmailLayout preview={`Your repair case ${caseNumber} is temporarily on hold`}>
      <Heading style={h1}>Repair On Hold</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        There is a temporary hold on your repair case <strong>{caseNumber}</strong>. Our team is working to resolve this as quickly as possible.
      </Text>

      <Section style={holdBox}>
        <Text style={holdLabel_}>{holdLabel}</Text>
      </Section>

      <Text style={body}>
        We will update you as soon as we have more information. No action is required from you at this time.
      </Text>

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
const holdBox: React.CSSProperties = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', textAlign: 'center' }
const holdLabel_: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#92400e', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const button: React.CSSProperties = { backgroundColor: '#0066cc', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block', fontFamily: 'Arial, sans-serif' }
