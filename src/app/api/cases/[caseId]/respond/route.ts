import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendCustomerResponseReceived } from '@/lib/email'

const bodySchema = z.object({
  response: z.string().min(3, 'Response must be at least 3 characters'),
  token: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { response, token } = parsed.data
    const supabase = createServiceClient()

    // ── Authenticate: session OR token ──────────────────────────────────────
    let authorId: string | null = null
    let authorName = 'Customer'

    if (token) {
      // Token-based access (no login required)
      const now = new Date().toISOString()
      const { data: tokenRow } = await supabase
        .from('case_response_tokens')
        .select('*')
        .eq('token', token)
        .eq('case_id', caseId)
        .is('used_at', null)
        .gt('expires_at', now)
        .single()

      if (!tokenRow) {
        return NextResponse.json({ message: 'This response link has expired or is invalid.' }, { status: 403 })
      }
    } else {
      // Session-based access
      const session = await auth.api.getSession({ headers: await headers() })
      if (!session?.user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
      }
      authorId = session.user.id
      authorName = session.user.name ?? 'Customer'
    }

    // ── Verify case is in AWAITING_CUSTOMER hold ─────────────────────────────
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, is_on_hold, hold_reason, customer_id, case_number')
      .eq('id', caseId)
      .single()

    if (!caseRow) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    }

    // If session-based, ensure customer owns the case (return 404 to not reveal existence)
    if (authorId && caseRow.customer_id && caseRow.customer_id !== authorId) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    }

    if (!caseRow.is_on_hold || caseRow.hold_reason !== 'AWAITING_CUSTOMER') {
      return NextResponse.json({ message: 'This case is not currently awaiting a customer response.' }, { status: 409 })
    }

    // ── Create update record ─────────────────────────────────────────────────
    const content = `${authorName} responded: ${response}`
    const { error: updateError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: authorId,
      content,
      is_internal: false,
    })

    if (updateError) {
      console.error('case_updates insert failed:', updateError)
      return NextResponse.json({ message: 'Failed to save response' }, { status: 500 })
    }

    // ── Clear hold state ─────────────────────────────────────────────────────
    const { error: caseError } = await supabase
      .from('cases')
      .update({
        is_on_hold: false,
        hold_reason: null,
        hold_customer_label: null,
        awaiting_customer_question: null,
      })
      .eq('id', caseId)

    if (caseError) {
      console.error('cases hold clear failed:', caseError)
      // Don't fail — the response was saved
    }

    // ── Mark token as used ───────────────────────────────────────────────────
    if (token) {
      await supabase
        .from('case_response_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)
        .eq('case_id', caseId)
    }

    // ── Notify staff of customer response ────────────────────────────────────
    // Find staff who should be notified (office-matched staff_uk/staff_us + admin)
    const { data: staffUsers } = await supabase
      .from('users')
      .select('email, full_name')
      .in('role', ['staff_uk', 'staff_us', 'admin'])

    if (staffUsers && staffUsers.length > 0) {
      // Get customer name for the notification
      const customerDisplayName = authorName !== 'Customer' ? authorName : 'Customer'
      const firstStaff = staffUsers[0] as { email: string; full_name: string | null }
      const notifyEmail = process.env.UK_RETURNS_EMAIL ?? firstStaff.email

      sendCustomerResponseReceived(caseId, notifyEmail, {
        staffName: 'Team',
        caseNumber: caseRow.case_number,
        customerName: customerDisplayName,
        responseContent: response,
      })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Respond route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
