import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface PaymentStubNotificationProps {
  customerName: string
  caseNumber: string
  inspectionFee: number
  contactEmail: string
}

export default function PaymentStubNotification({
  customerName,
  caseNumber,
  inspectionFee,
  contactEmail,
}: PaymentStubNotificationProps) {
  return (
    <EmailLayout preview={`Payment required for your return case ${caseNumber}`}>
      <Heading style={h1}>Payment Required</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Payment is required to proceed with your return. A member of our team will contact you within 24 hours to arrange payment.
      </Text>

      <Section style={feeBox}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={feeLabel}>Case Reference</td>
              <td style={feeValue}>{caseNumber}</td>
            </tr>
            <tr>
              <td style={feeLabel}>Inspection Fee</td>
              <td style={{ ...feeValue, fontWeight: 'bold', color: '#0f172a' }}>
                £{inspectionFee.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={hr} />

      <Text style={body}>
        Please quote your case reference <strong>{caseNumber}</strong> in all correspondence.
        If you have any questions, please contact us at{' '}
        <a href={`mailto:${contactEmail}`} style={link}>{contactEmail}</a>.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const feeBox: React.CSSProperties = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', margin: '0 0 0' }
const feeLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '6px 16px 6px 0', fontFamily: 'Arial, sans-serif', width: '140px' }
const feeValue: React.CSSProperties = { fontSize: '14px', color: '#475569', padding: '6px 0', fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const link: React.CSSProperties = { color: '#0066cc' }
