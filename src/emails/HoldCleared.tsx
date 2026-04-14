import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface HoldClearedProps {
  customerName: string
  caseNumber: string
  caseUrl: string
}

export default function HoldCleared({
  customerName,
  caseNumber,
  caseUrl,
}: HoldClearedProps) {
  return (
    <EmailLayout preview={`Good news — work has resumed on your case ${caseNumber}`}>
      <Heading style={h1}>Repair Resumed</Heading>
      <Text style={greeting}>Dear {customerName},</Text>

      <Section style={goodNewsBox}>
        <Text style={goodNewsText}>
          Good news — the hold on your repair case <strong>{caseNumber}</strong> has been removed and work has resumed.
        </Text>
      </Section>

      <Text style={body}>
        Our team is continuing with your repair. We will keep you updated as it progresses through each stage.
      </Text>

      <Hr style={hr} />

      <Button href={caseUrl} style={button}>
        View Case
      </Button>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const goodNewsBox: React.CSSProperties = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const goodNewsText: React.CSSProperties = { fontSize: '15px', color: '#14532d', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const button: React.CSSProperties = { backgroundColor: '#0066cc', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block', fontFamily: 'Arial, sans-serif' }
