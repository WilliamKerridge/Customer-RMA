import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { requireStaff, canAccessOffice } from '@/lib/auth-helpers'
import { WorkshopStage, WORKSHOP_STAGES } from '@/types/workshop'

const BodySchema = z.object({
  stage: z.enum(WORKSHOP_STAGES as [WorkshopStage, ...WorkshopStage[]]),
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

    const { stage } = parsed.data
    const supabase = createServiceClient()

    // Verify product belongs to this case (and gate on the case's office)
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

    // Update product-level stage
    const { error: updateErr } = await supabase
      .from('case_products')
      .update({ workshop_stage: stage })
      .eq('id', productId)

    if (updateErr) {
      console.error('Product stage update failed:', updateErr)
      return NextResponse.json({ message: 'Failed to update stage' }, { status: 500 })
    }

    // Check if this case has only one product — if so, cascade to case-level stage
    const { data: allProducts } = await supabase
      .from('case_products')
      .select('id')
      .eq('case_id', caseId)

    const isSingleProduct = (allProducts ?? []).length === 1

    if (isSingleProduct) {
      await supabase
        .from('cases')
        .update({ workshop_stage: stage, status: 'IN_REPAIR' })
        .eq('id', caseId)
    }

    // Timeline entry tagged to this product
    const productName = (productRow.products as { display_name: string } | null)?.display_name ?? 'product'
    await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId,
      author_id: user.canonicalId,
      content: `Stage updated to ${stage.replace(/_/g, ' ').toLowerCase()} for ${productName}`,
      is_internal: false,
    })

    return NextResponse.json({ ok: true, cascaded: isSingleProduct })
  } catch (err) {
    console.error('Product stage route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
