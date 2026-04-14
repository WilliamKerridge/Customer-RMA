import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface CaseRejectedProps {
  customerName: string
  caseNumber: string
  reason: string
}

export default function CaseRejected({
  customerName,
  caseNumber,
  reason,
}: CaseRejectedProps) {
  return (
    <EmailLayout preview={`Update on your return request ${caseNumber}`}>
      <Heading style={h1}>Return Request Update</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Unfortunately, we are unable to proceed with your return request{' '}
        <strong>{caseNumber}</strong> at this time.
      </Text>

      <Section style={reasonBox}>
        <Text style={reasonLabel}>Reason</Text>
        <Text style={reasonText}>{reason}</Text>
      </Section>

      <Hr style={hr} />

      <Text style={footer}>
        If you have any questions or believe this decision was made in error, please contact our returns team quoting your case reference <strong>{caseNumber}</strong>.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const reasonBox: React.CSSProperties = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const reasonLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'Arial, sans-serif' }
const reasonText: React.CSSProperties = { fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
