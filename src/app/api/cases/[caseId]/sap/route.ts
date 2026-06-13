import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { requireStaff, canAccessOffice } from '@/lib/auth-helpers'

const SapSchema = z.object({
  sap_sales_order:         z.string().trim().max(50).nullable().optional(),
  sap_works_order:         z.string().trim().max(50).nullable().optional(),
  sap_estimated_completion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sap_order_value:         z.number().min(0).nullable().optional(),
  sap_spent_hours:         z.number().min(0).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await requireStaff()
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()

  const body = await request.json()
  const parsed = SapSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid data', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId } = await params

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, office')
    .eq('id', caseId)
    .single()

  if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
  if (!canAccessOffice(user, caseRow.office)) {
    return NextResponse.json({ message: 'This case belongs to another office queue' }, { status: 403 })
  }

  // Only include fields that were explicitly provided (allow nulls to clear values)
  const updates: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(parsed.data)) {
    if (val !== undefined) updates[key] = val
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', caseId)

  if (error) {
    console.error('SAP update error:', error)
    return NextResponse.json({ message: 'Failed to update SAP data' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
