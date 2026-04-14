import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendCaseRejected } from '@/lib/email'

const bodySchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { reason } = parsed.data
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(caseRow.status)) {
      return NextResponse.json({ message: 'Case cannot be rejected in its current status' }, { status: 409 })
    }

    const { error } = await supabase
      .from('cases')
      .update({ status: 'REJECTED', closed_at: new Date().toISOString() })
      .eq('id', caseId)

    if (error) {
      console.error('Case reject failed:', error)
      return NextResponse.json({ message: 'Failed to reject case' }, { status: 500 })
    }

    // Mark all products as rejected
    await supabase
      .from('case_products')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('case_id', caseId)

    const { error: auditError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: `Case rejected. Reason: ${reason}`,
      is_internal: false,
      status_change_to: 'REJECTED',
    })
    if (auditError) console.error('Audit insert failed on reject:', auditError)

    // Send rejection email to customer (non-blocking)
    if (caseRow.customer_id) {
      const { data: customerUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', caseRow.customer_id)
        .single()
      if (customerUser) {
        const cu = customerUser as { email: string; full_name: string | null }
        sendCaseRejected(caseId, cu.email, {
          customerName: cu.full_name ?? cu.email,
          caseNumber: caseRow.case_number,
          reason,
        })
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Reject route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
