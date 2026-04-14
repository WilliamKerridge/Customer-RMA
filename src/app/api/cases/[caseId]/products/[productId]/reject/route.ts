import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendCaseRejected, sendPartialRejection } from '@/lib/email'

const BodySchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
})

async function requireStaff(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users').select('id, role').eq('email', session.user.email).single()
  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null
  return { ...session.user, canonicalId: profile.id }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; productId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId, productId } = await params
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { reason } = parsed.data
    const supabase = createServiceClient()

    // Verify case exists and is in a rejectable status
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(caseRow.status)) {
      return NextResponse.json(
        { message: 'Products can only be rejected during SUBMITTED or UNDER_REVIEW' },
        { status: 409 }
      )
    }

    // Verify the product belongs to this case
    const { data: productRow } = await supabase
      .from('case_products')
      .select('id, status, products(display_name, part_number)')
      .eq('id', productId)
      .eq('case_id', caseId)
      .single()

    if (!productRow) return NextResponse.json({ message: 'Product not found on this case' }, { status: 404 })
    if ((productRow as { status: string }).status === 'rejected') {
      return NextResponse.json({ message: 'Product is already rejected' }, { status: 409 })
    }

    // Mark product as rejected
    const { error: updateErr } = await supabase
      .from('case_products')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', productId)

    if (updateErr) {
      console.error('Product reject failed:', updateErr)
      return NextResponse.json({ message: 'Failed to reject product' }, { status: 500 })
    }

    // Get display name for timeline entry
    const productName = (productRow.products as { display_name: string; part_number: string } | null)
      ?.display_name ?? 'Unknown product'

    // Timeline entry — tagged to the specific product
    await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId,
      author_id: user.canonicalId,
      content: `Product rejected: ${productName}. Reason: ${reason}`,
      is_internal: false,
    })

    // Check if all products are now rejected
    const { data: remaining } = await supabase
      .from('case_products')
      .select('id, status')
      .eq('case_id', caseId)

    const allRejected = (remaining ?? []).every(p => (p as { status: string }).status === 'rejected')

    // Fetch customer for email
    let customerEmail: string | null = null
    let customerName: string | null = null
    if (caseRow.customer_id) {
      const { data: cu } = await supabase
        .from('users').select('email, full_name').eq('id', caseRow.customer_id).single()
      if (cu) {
        const c = cu as { email: string; full_name: string | null }
        customerEmail = c.email
        customerName = c.full_name ?? c.email
      }
    }

    if (allRejected) {
      await supabase
        .from('cases')
        .update({ status: 'REJECTED', closed_at: new Date().toISOString() })
        .eq('id', caseId)

      await supabase.from('case_updates').insert({
        case_id: caseId,
        author_id: user.canonicalId,
        content: 'All products rejected. Case closed.',
        is_internal: false,
        status_change_to: 'REJECTED',
      })

      if (customerEmail && customerName) {
        sendCaseRejected(caseId, customerEmail, {
          customerName,
          caseNumber: caseRow.case_number,
          reason: 'All submitted products have been rejected. Please see individual product notes for details.',
        })
      }
    } else {
      if (customerEmail && customerName) {
        sendPartialRejection(caseId, customerEmail, {
          customerName,
          caseNumber: caseRow.case_number,
          rejectedProductName: productName,
          reason,
        })
      }
    }

    return NextResponse.json({ ok: true, allRejected })
  } catch (err) {
    console.error('Product reject route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
