import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const bodySchema = z.object({
  content: z.string().min(3, 'Update must be at least 3 characters'),
  isInternal: z.boolean().default(false),
  statusChangeTo: z.string().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
})

async function requireStaff() {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { content, isInternal, statusChangeTo, productId } = parsed.data
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    // Optionally update case status — only for top-level case status values.
    // Workshop stage and hold values (e.g. AWAITING_TEST, AWAITING_PARTS) are
    // stored on the update as a label only; they do not mutate cases.status.
    // IMPORTANT: Do NOT add CREDIT_HELD to this set — it is an internal hold
    // reason only, never a valid cases.status value, and must never be surfaced
    // in customer-facing timeline reads without filtering.
    const CASE_STATUSES = new Set([
      'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'RMA_ISSUED',
      'PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN',
      'CLOSED', 'REJECTED',
    ])
    if (statusChangeTo && CASE_STATUSES.has(statusChangeTo)) {
      const { error: statusError } = await supabase
        .from('cases')
        .update({ status: statusChangeTo })
        .eq('id', caseId)
      if (statusError) {
        console.error('Status update failed:', statusError)
        return NextResponse.json({ message: 'Failed to update case status' }, { status: 500 })
      }
    }

    const { error } = await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId ?? null,
      author_id: user.canonicalId,
      content,
      is_internal: isInternal,
      status_change_to: statusChangeTo ?? null,
    })

    if (error) {
      console.error('case_updates insert failed:', error)
      return NextResponse.json({ message: 'Failed to post update' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Updates route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
