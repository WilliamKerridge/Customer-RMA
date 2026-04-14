import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BodySchema = z.object({
  workshop_findings:        z.string().max(2000).nullable().optional(),
  staff_notes:              z.string().max(2000).nullable().optional(),
  sap_works_order:          z.string().max(50).nullable().optional(),
  sap_estimated_completion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sap_order_value:          z.number().min(0).nullable().optional(),
  sap_spent_hours:          z.number().min(0).nullable().optional(),
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
  const updates: Record<string, unknown> = {}

  if (parsed.data.workshop_findings !== undefined)        updates.workshop_findings        = parsed.data.workshop_findings
  if (parsed.data.staff_notes !== undefined)              updates.staff_notes              = parsed.data.staff_notes
  if (parsed.data.sap_works_order !== undefined)          updates.sap_works_order          = parsed.data.sap_works_order
  if (parsed.data.sap_estimated_completion !== undefined) updates.sap_estimated_completion = parsed.data.sap_estimated_completion
  if (parsed.data.sap_order_value !== undefined)          updates.sap_order_value          = parsed.data.sap_order_value
  if (parsed.data.sap_spent_hours !== undefined)          updates.sap_spent_hours          = parsed.data.sap_spent_hours

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('case_products')
    .update(updates)
    .eq('id', productId)
    .eq('case_id', caseId)

  if (error) {
    console.error('Product notes update failed:', error)
    return NextResponse.json({ message: 'Failed to update product data' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
