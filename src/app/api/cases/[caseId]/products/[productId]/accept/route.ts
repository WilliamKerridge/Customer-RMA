import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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
    const supabase = createServiceClient()

    // Verify case exists and is in a reviewable status
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(caseRow.status)) {
      return NextResponse.json(
        { message: 'Products can only be accepted during SUBMITTED or UNDER_REVIEW' },
        { status: 409 }
      )
    }

    // Verify the product belongs to this case
    const { data: productRow } = await supabase
      .from('case_products')
      .select('id, status, products(display_name)')
      .eq('id', productId)
      .eq('case_id', caseId)
      .single()

    if (!productRow) return NextResponse.json({ message: 'Product not found on this case' }, { status: 404 })
    if ((productRow as { status: string }).status === 'accepted') {
      return NextResponse.json({ message: 'Product is already accepted' }, { status: 409 })
    }

    // Mark product as accepted
    const { error: updateErr } = await supabase
      .from('case_products')
      .update({ status: 'accepted', rejection_reason: null })
      .eq('id', productId)

    if (updateErr) {
      console.error('Product accept failed:', updateErr)
      return NextResponse.json({ message: 'Failed to accept product' }, { status: 500 })
    }

    const productName = (productRow.products as { display_name: string } | null)
      ?.display_name ?? 'Unknown product'

    await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId,
      author_id: user.canonicalId,
      content: `Product accepted: ${productName}.`,
      is_internal: false,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Product accept route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
