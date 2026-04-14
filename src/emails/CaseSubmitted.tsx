import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface Product {
  display_name: string
  part_number?: string
  quantity: number
}

interface CaseSubmittedProps {
  customerName: string
  caseNumber: string
  products: Product[]
  officeLabel: string
  requiredDate: string | null
}

export default function CaseSubmitted({
  customerName,
  caseNumber,
  products,
  officeLabel,
  requiredDate,
}: CaseSubmittedProps) {
  return (
    <EmailLayout preview={`Your return request ${caseNumber} has been received`}>
      <Heading style={h1}>Return Request Received</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Thank you for submitting your return request. Your case has been created and our team will review it within 24 hours.
      </Text>

      {/* Case number highlight */}
      <Section style={caseBox}>
        <Text style={caseLabel}>Your Case Reference</Text>
        <Text style={caseNumber_}>
          {caseNumber}
        </Text>
        <Text style={caseSubLabel}>Please quote this reference in all correspondence</Text>
      </Section>

      <Hr style={hr} />

      {/* Products */}
      <Text style={sectionTitle}>Products Submitted</Text>
      {products.map((p, i) => (
        <Section key={i} style={productRow}>
          <Text style={productName}>{p.display_name}</Text>
          {p.part_number && <Text style={productMeta}>Part: {p.part_number}</Text>}
          <Text style={productMeta}>Qty: {p.quantity}</Text>
        </Section>
      ))}

      <Hr style={hr} />

      {/* Details */}
      <Text style={sectionTitle}>Case Details</Text>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={detailLabel}>Office</td>
            <td style={detailValue}>{officeLabel}</td>
          </tr>
          {requiredDate && (
            <tr>
              <td style={detailLabel}>Required By</td>
              <td style={detailValue}>{requiredDate}</td>
            </tr>
          )}
        </tbody>
      </table>

      <Hr style={hr} />

      <Text style={footer}>
        Once reviewed, you will receive a further email with your RMA number and shipping instructions.
        If you have any questions, please contact us quoting your case reference.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }
const caseBox: React.CSSProperties = { backgroundColor: '#f0f9ff', border: '2px solid #0066cc', borderRadius: '8px', padding: '20px', textAlign: 'center', margin: '0 0 24px' }
const caseLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#0066cc', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }
const caseNumber_: React.CSSProperties = { fontSize: '26px', fontWeight: 'bold', color: '#0066cc', fontFamily: 'monospace', margin: '0 0 6px' }
const caseSubLabel: React.CSSProperties = { fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const sectionTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const productRow: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '10px 14px', margin: '0 0 8px' }
const productName: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }
const productMeta: React.CSSProperties = { fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'Arial, sans-serif' }
const detailLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '4px 12px 4px 0', fontFamily: 'Arial, sans-serif', width: '120px' }
const detailValue: React.CSSProperties = { fontSize: '13px', color: '#0f172a', padding: '4px 0', fontFamily: 'Arial, sans-serif' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
