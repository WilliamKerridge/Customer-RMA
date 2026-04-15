/**
 * Email sending service — all transactional emails go through here.
 *
 * Each function wraps sending + DB logging in a try/catch.
 * Email failures NEVER throw — they log and return null so the caller's
 * action always succeeds even if Resend is unavailable.
 */

import { render } from '@react-email/components'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { createServiceClient } from '@/lib/supabase/service'

import CaseSubmitted from '@/emails/CaseSubmitted'
import RMAIssued from '@/emails/RMAIssued'
import CaseUpdate from '@/emails/CaseUpdate'
import CaseRejected from '@/emails/CaseRejected'
import ActionRequired from '@/emails/ActionRequired'
import HoldStateChanged from '@/emails/HoldStateChanged'
import HoldCleared from '@/emails/HoldCleared'
import WorkshopStageUpdate from '@/emails/WorkshopStageUpdate'
import CustomerResponseReceived from '@/emails/CustomerResponseReceived'
import PaymentStubNotification from '@/emails/PaymentStubNotification'
import PartialRejection from '@/emails/PartialRejection'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ── Internal helper ──────────────────────────────────────────────────────────

async function send({
  caseId,
  recipientEmail,
  subject,
  template,
  html,
}: {
  caseId: string | null
  recipientEmail: string
  subject: string
  template: string
  html: string
}): Promise<string | null> {
  // Testing override — when TEST_EMAIL_OVERRIDE is set, redirect every
  // outgoing email to that address and prepend the intended recipient
  // to the subject line so we can tell which customer would have received
  // it. Logged to email_notifications with the original recipient so the
  // audit trail stays truthful.
  const override = process.env.TEST_EMAIL_OVERRIDE?.trim()
  const deliverTo = override || recipientEmail
  const finalSubject = override ? `[→ ${recipientEmail}] ${subject}` : subject

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: deliverTo,
      subject: finalSubject,
      html,
    })

    if (error) {
      console.error(`Email send failed [${template}]:`, error)
      return null
    }

    const messageId = data?.id ?? null

    // Log to email_notifications (non-blocking)
    if (caseId) {
      const supabase = createServiceClient()
      await supabase.from('email_notifications').insert({
        case_id: caseId,
        recipient_email: recipientEmail,
        template,
        resend_message_id: messageId,
      }).then(({ error: dbErr }) => {
        if (dbErr) console.error('email_notifications insert failed:', dbErr)
      })
    }

    return messageId
  } catch (err) {
    console.error(`Email error [${template}]:`, err)
    return null
  }
}

// ── Public sending functions ─────────────────────────────────────────────────

export interface SubmittedProduct {
  display_name: string
  part_number?: string
  quantity: number
}

export async function sendCaseSubmitted(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    products: SubmittedProduct[]
    officeLabel: string
    requiredDate: string | null
  }
) {
  const html = await render(CaseSubmitted(props))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Your return request ${props.caseNumber} has been received`,
    template: 'CaseSubmitted',
    html,
  })
}

export async function sendRMAIssued(
  caseId: string,
  customerEmail: string,
  _staffEmail: string,
  props: {
    customerName: string
    caseNumber: string
    rmaNumber: string
    officeAddress: string
    products?: {
      display_name: string
      part_number?: string | null
      quantity: number
      tariff_code?: string | null
    }[]
  }
) {
  const html = await render(RMAIssued(props))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Your return has been approved — RMA ${props.rmaNumber} issued`,
    template: 'RMAIssued',
    html,
  })
}

export async function sendCaseUpdate(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    updateContent: string
    authorName: string
    caseUrl: string
  }
) {
  const html = await render(CaseUpdate(props))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Update on your case ${props.caseNumber}`,
    template: 'CaseUpdate',
    html,
  })
}

export async function sendCaseRejected(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    reason: string
  }
) {
  const html = await render(CaseRejected(props))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Update on your return request ${props.caseNumber}`,
    template: 'CaseRejected',
    html,
  })
}

export async function sendActionRequired(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    question: string
    token: string
    expiresAt: string
  }
) {
  const responseUrl = `${APP_URL}/cases/${caseId}/respond?token=${props.token}`
  const html = await render(ActionRequired({
    customerName: props.customerName,
    caseNumber: props.caseNumber,
    question: props.question,
    responseUrl,
    expiresAt: props.expiresAt,
  }))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Action required on your case ${props.caseNumber}`,
    template: 'ActionRequired',
    html,
  })
}

export async function sendHoldStateChanged(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    holdLabel: string
  }
) {
  const caseUrl = `${APP_URL}/cases/${caseId}`
  const html = await render(HoldStateChanged({ ...props, caseUrl }))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Your repair case ${props.caseNumber} is on hold`,
    template: 'HoldStateChanged',
    html,
  })
}

export async function sendHoldCleared(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
  }
) {
  const caseUrl = `${APP_URL}/cases/${caseId}`
  const html = await render(HoldCleared({ ...props, caseUrl }))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Good news — work has resumed on your case ${props.caseNumber}`,
    template: 'HoldCleared',
    html,
  })
}

export async function sendWorkshopStageUpdate(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    stageName: string
    stagesCompleted: number
    totalStages: number
    estimatedCompletion: string | null
  }
) {
  const caseUrl = `${APP_URL}/cases/${caseId}`
  const html = await render(WorkshopStageUpdate({ ...props, caseUrl }))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Your repair has reached a new stage: ${props.stageName}`,
    template: 'WorkshopStageUpdate',
    html,
  })
}

export async function sendCustomerResponseReceived(
  caseId: string,
  staffEmail: string,
  props: {
    staffName: string
    caseNumber: string
    customerName: string
    responseContent: string
  }
) {
  const caseUrl = `${APP_URL}/admin/cases/${caseId}`
  const html = await render(CustomerResponseReceived({ ...props, caseUrl }))
  return send({
    caseId,
    recipientEmail: staffEmail,
    subject: `Customer responded on case ${props.caseNumber}`,
    template: 'CustomerResponseReceived',
    html,
  })
}

export async function sendPaymentStubNotification(
  caseId: string,
  customerEmail: string,
  props: {
    customerName: string
    caseNumber: string
    inspectionFee: number
    contactEmail: string
  }
) {
  const html = await render(PaymentStubNotification(props))
  return send({
    caseId,
    recipientEmail: customerEmail,
    subject: `Payment required for your return case ${props.caseNumber}`,
    template: 'PaymentStubNotification',
    html,
  })
}

export async function sendPartialRejection(
  caseId: string,
  recipientEmail: string,
  props: {
    customerName: string
    caseNumber: string
    rejectedProductName: string
    reason: string
  }
) {
  const html = await render(PartialRejection(props))
  return send({
    caseId,
    recipientEmail,
    subject: `Product update for your return ${props.caseNumber}`,
    template: 'PartialRejection',
    html,
  })
}
