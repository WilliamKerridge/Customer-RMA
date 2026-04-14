import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface CaseUpdateProps {
  customerName: string
  caseNumber: string
  updateContent: string
  authorName: string
  caseUrl: string
}

export default function CaseUpdate({
  customerName,
  caseNumber,
  updateContent,
  authorName,
  caseUrl,
}: CaseUpdateProps) {
  return (
    <EmailLayout preview={`Update on your case ${caseNumber}`}>
      <Heading style={h1}>Case Update</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        There is a new update on your return case <strong>{caseNumber}</strong>.
      </Text>

      <Section style={updateBox}>
        <Text style={updateMeta}>{authorName} — Cosworth Returns Team</Text>
        <Text style={updateText}>{updateContent}</Text>
      </Section>

      <Hr style={hr} />

      <Button href={caseUrl} style={button}>
        View Case
      </Button>

      <Text style={footer}>
        You can view your full case history and all updates at any time by logging in to the Cosworth Returns Portal.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const updateBox: React.CSSProperties = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '0 0 24px' }
const updateMeta: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }
const updateText: React.CSSProperties = { fontSize: '14px', color: '#0f172a', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const button: React.CSSProperties = { backgroundColor: '#0066cc', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
