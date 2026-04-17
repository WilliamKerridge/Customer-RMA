import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BodySchema = z.object({
  product_id:    z.string().uuid().optional(),
  serial_number: z.string().max(100).nullable().optional(),
  quantity:      z.number().int().min(1).max(99).optional(),
  fault_notes:   z.string().max(2000).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; productId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('users').select('role').eq('email', session.user.email).single()

  if (!['staff_uk', 'staff_us', 'admin'].includes((profile as { role: string } | null)?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid data', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId, productId } = await params

  // If changing product, verify the target product exists and is active
  if (parsed.data.product_id) {
    const { data: targetProduct } = await supabase
      .from('products')
      .select('id, active')
      .eq('id', parsed.data.product_id)
      .single()
    if (!targetProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 400 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.product_id    !== undefined) updates.product_id    = parsed.data.product_id
  if (parsed.data.serial_number !== undefined) updates.serial_number = parsed.data.serial_number
  if (parsed.data.quantity      !== undefined) updates.quantity      = parsed.data.quantity
  if (parsed.data.fault_notes   !== undefined) updates.fault_notes   = parsed.data.fault_notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('case_products')
    .update(updates)
    .eq('id', productId)
    .eq('case_id', caseId)

  if (error) {
    console.error('Product edit failed:', error)
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
