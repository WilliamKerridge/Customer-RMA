import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface RMAIssuedProps {
  customerName: string
  caseNumber: string
  rmaNumber: string
  officeAddress: string
}

export default function RMAIssued({
  customerName,
  caseNumber,
  rmaNumber,
  officeAddress,
}: RMAIssuedProps) {
  return (
    <EmailLayout preview={`Your return has been approved — RMA ${rmaNumber} issued`}>
      <Heading style={h1}>Return Approved</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Your return request has been approved. Please ship your unit(s) to the address below, quoting your RMA number on the outer packaging.
      </Text>

      {/* Reference boxes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', paddingRight: '8px' }}>
              <Section style={refBox}>
                <Text style={refLabel}>Case Reference</Text>
                <Text style={refValue}>{caseNumber}</Text>
              </Section>
            </td>
            <td style={{ width: '50%', paddingLeft: '8px' }}>
              <Section style={{ ...refBox, borderColor: '#7c3aed', backgroundColor: '#faf5ff' }}>
                <Text style={{ ...refLabel, color: '#7c3aed' }}>RMA Number</Text>
                <Text style={{ ...refValue, color: '#7c3aed' }}>{rmaNumber}</Text>
              </Section>
            </td>
          </tr>
        </tbody>
      </table>

      <Hr style={hr} />

      <Text style={sectionTitle}>Shipping Address</Text>
      <Section style={addressBox}>
        <Text style={addressText}>{officeAddress}</Text>
      </Section>

      <Hr style={hr} />

      <Text style={instructions}>
        Please ensure your RMA number <strong>{rmaNumber}</strong> is clearly marked on the outside of the packaging.
        Once we receive your unit(s), we will begin the repair process and keep you updated on progress.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }
const refBox: React.CSSProperties = { backgroundColor: '#f0f9ff', border: '2px solid #0066cc', borderRadius: '8px', padding: '16px', textAlign: 'center' }
const refLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#0066cc', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'Arial, sans-serif' }
const refValue: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', color: '#0066cc', fontFamily: 'monospace', margin: 0 }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const sectionTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const addressBox: React.CSSProperties = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '0 0 0' }
const addressText: React.CSSProperties = { fontSize: '14px', color: '#0f172a', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line', fontFamily: 'Arial, sans-serif' }
const instructions: React.CSSProperties = { fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
