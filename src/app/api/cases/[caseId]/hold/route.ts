import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { HoldReason, HoldCustomerLabel, HOLD_REASONS } from '@/types/workshop'
import { sendActionRequired, sendHoldStateChanged, sendHoldCleared } from '@/lib/email'

const setHoldSchema = z.object({
  holdReason: z.enum(HOLD_REASONS as [HoldReason, ...HoldReason[]]),
  customerLabel: z.string().min(1),
  question: z.string().optional(),
})

async function requireStaff(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null

  return { ...session.user, canonicalId: profile.id }
}

// POST — set hold
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const body = await request.json()
    const parsed = setHoldSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { holdReason, customerLabel, question } = parsed.data
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, case_number, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    const { error: holdUpdateError } = await supabase.from('cases').update({
      is_on_hold: true,
      hold_reason: holdReason,
      hold_customer_label: customerLabel,
      awaiting_customer_question: holdReason === HoldReason.AWAITING_CUSTOMER ? (question ?? null) : null,
    }).eq('id', caseId)

    if (holdUpdateError) {
      console.error('Case hold update failed:', holdUpdateError)
      return NextResponse.json({ message: 'Failed to set hold' }, { status: 500 })
    }

    // For AWAITING_CUSTOMER: generate response token
    let token: string | null = null
    if (holdReason === HoldReason.AWAITING_CUSTOMER) {
      token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('case_response_tokens').insert({
        case_id: caseId,
        token,
        expires_at: expiresAt,
      })
    }

    // Create customer-visible update
    const updateContent = holdReason === HoldReason.AWAITING_CUSTOMER && question
      ? question
      : `Case placed on hold: ${HoldCustomerLabel[holdReason]}.`

    const { error: auditError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: updateContent,
      is_internal: false,
    })
    if (auditError) console.error('Audit insert failed on hold set:', auditError)

    // Send email to customer (non-blocking)
    if (caseRow.customer_id) {
      const { data: customerUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', caseRow.customer_id)
        .single()
      if (customerUser) {
        const cu = customerUser as { email: string; full_name: string | null }
        if (holdReason === HoldReason.AWAITING_CUSTOMER && token && question) {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          sendActionRequired(caseId, cu.email, {
            customerName: cu.full_name ?? cu.email,
            caseNumber: caseRow.case_number,
            question,
            token,
            expiresAt,
          })
        } else {
          sendHoldStateChanged(caseId, cu.email, {
            customerName: cu.full_name ?? cu.email,
            caseNumber: caseRow.case_number,
            holdLabel: customerLabel,
          })
        }
      }
    }

    return NextResponse.json({ ok: true, token }, { status: 200 })
  } catch (err) {
    console.error('Hold POST error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — clear hold
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, case_number, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    const { error: clearError } = await supabase.from('cases').update({
      is_on_hold: false,
      hold_reason: null,
      hold_customer_label: null,
      awaiting_customer_question: null,
    }).eq('id', caseId)

    if (clearError) {
      console.error('Case hold clear failed:', clearError)
      return NextResponse.json({ message: 'Failed to clear hold' }, { status: 500 })
    }

    const { error: auditError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: 'Hold cleared. Work has resumed.',
      is_internal: false,
    })
    if (auditError) console.error('Audit insert failed on hold clear:', auditError)

    // Send hold cleared email to customer (non-blocking)
    if (caseRow.customer_id) {
      const { data: customerUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', caseRow.customer_id)
        .single()
      if (customerUser) {
        const cu = customerUser as { email: string; full_name: string | null }
        sendHoldCleared(caseId, cu.email, {
          customerName: cu.full_name ?? cu.email,
          caseNumber: caseRow.case_number,
        })
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Hold DELETE error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
