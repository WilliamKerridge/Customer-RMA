import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { requireStaff, canAccessOffice } from '@/lib/auth-helpers'

const BodySchema = z.object({
  fee_basis: z.enum(['standard', 'warranty', 'foc']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; productId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId, productId } = await params
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { fee_basis } = parsed.data
    const supabase = createServiceClient()

    const { data: productRow } = await supabase
      .from('case_products')
      .select('id, cases(office), products(display_name)')
      .eq('id', productId)
      .eq('case_id', caseId)
      .single()

    if (!productRow) {
      return NextResponse.json({ message: 'Product not found on this case' }, { status: 404 })
    }
    const caseOffice = (productRow.cases as { office: 'UK' | 'US' } | null)?.office
    if (!caseOffice || !canAccessOffice(user, caseOffice)) {
      return NextResponse.json({ message: 'This case belongs to another office queue' }, { status: 403 })
    }

    const { error } = await supabase
      .from('case_products')
      .update({ fee_basis })
      .eq('id', productId)

    if (error) {
      console.error('Fee basis update failed:', error)
      return NextResponse.json({ message: 'Failed to update fee basis' }, { status: 500 })
    }

    const productName = (productRow.products as { display_name: string } | null)?.display_name ?? 'product'
    const label = fee_basis === 'warranty' ? 'Warranty (no charge)' : fee_basis === 'foc' ? 'FOC (no charge)' : 'Standard'

    await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId,
      author_id: user.canonicalId,
      content: `Fee basis for ${productName} set to: ${label}.`,
      is_internal: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Fee basis route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
