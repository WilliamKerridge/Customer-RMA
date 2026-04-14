import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface PartialRejectionProps {
  customerName: string
  caseNumber: string
  rejectedProductName: string
  reason: string
}

export default function PartialRejection({
  customerName,
  caseNumber,
  rejectedProductName,
  reason,
}: PartialRejectionProps) {
  return (
    <EmailLayout preview={`Product update for your return ${caseNumber}`}>
      <Heading style={h1}>Product Return Update</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        We are writing regarding your return request <strong>{caseNumber}</strong>. One of the
        products in your submission cannot be accepted for repair at this time.
      </Text>

      <Section style={productBox}>
        <Text style={productLabel}>Rejected Product</Text>
        <Text style={productName}>{rejectedProductName}</Text>
        <Text style={reasonLabel}>Reason</Text>
        <Text style={reasonText}>{reason}</Text>
      </Section>

      <Text style={body}>
        Your case remains open and we will continue to process the remaining items in your
        submission. You will receive further updates as your repair progresses.
      </Text>

      <Hr style={hr} />

      <Text style={footer}>
        If you have any questions, please contact our returns team quoting your case
        reference <strong>{caseNumber}</strong>.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const productBox: React.CSSProperties = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const productLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const productName: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#7f1d1d', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const reasonLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const reasonText: React.CSSProperties = { fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
