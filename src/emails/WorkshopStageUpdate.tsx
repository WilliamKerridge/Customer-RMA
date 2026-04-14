import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface WorkshopStageUpdateProps {
  customerName: string
  caseNumber: string
  stageName: string
  stagesCompleted: number
  totalStages: number
  estimatedCompletion: string | null
  caseUrl: string
}

export default function WorkshopStageUpdate({
  customerName,
  caseNumber,
  stageName,
  stagesCompleted,
  totalStages,
  estimatedCompletion,
  caseUrl,
}: WorkshopStageUpdateProps) {
  const progressPercent = Math.round((stagesCompleted / totalStages) * 100)
  const filledBars = Math.round((stagesCompleted / totalStages) * 10)
  const emptyBars = 10 - filledBars
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)

  return (
    <EmailLayout preview={`Your repair has reached a new stage: ${stageName}`}>
      <Heading style={h1}>Repair Progress Update</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        Your repair case <strong>{caseNumber}</strong> has progressed to a new stage.
      </Text>

      <Section style={stageBox}>
        <Text style={stageLabel}>Current Stage</Text>
        <Text style={stageName_}>{stageName}</Text>
      </Section>

      {/* Progress indicator */}
      <Section style={progressSection}>
        <Text style={progressLabel}>
          Stage {stagesCompleted} of {totalStages} complete ({progressPercent}%)
        </Text>
        <Text style={progressBarText}>{progressBar}</Text>
      </Section>

      {estimatedCompletion && (
        <Section style={estBox}>
          <Text style={estText}>
            Estimated completion: <strong>{estimatedCompletion}</strong>
          </Text>
        </Section>
      )}

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
const stageBox: React.CSSProperties = { backgroundColor: '#eff6ff', border: '2px solid #0066cc', borderRadius: '8px', padding: '20px', textAlign: 'center', margin: '0 0 16px' }
const stageLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#0066cc', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'Arial, sans-serif' }
const stageName_: React.CSSProperties = { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0, fontFamily: 'Arial, sans-serif' }
const progressSection: React.CSSProperties = { textAlign: 'center', margin: '0 0 16px' }
const progressLabel: React.CSSProperties = { fontSize: '13px', color: '#64748b', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const progressBarText: React.CSSProperties = { fontSize: '16px', color: '#0066cc', fontFamily: 'monospace', letterSpacing: '2px', margin: 0 }
const estBox: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '12px 16px', margin: '0 0 0' }
const estText: React.CSSProperties = { fontSize: '13px', color: '#475569', margin: 0, textAlign: 'center', fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const button: React.CSSProperties = { backgroundColor: '#0066cc', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block', fontFamily: 'Arial, sans-serif' }
