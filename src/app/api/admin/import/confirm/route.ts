import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { ImportPreviewRow } from '../parse/route'

const ConfirmSchema = z.object({
  filename: z.string().min(1),
  rows: z.array(z.object({
    caseId: z.string().uuid().nullable(),
    workshopStage: z.string().nullable(),
    holdReason: z.string().nullable(),
    clearHold: z.boolean(),
    sapSalesOrder: z.string().nullable(),
    sapWorksOrder: z.string().nullable(),
    sapEstimatedCompletion: z.string().nullable(),
    sapOrderValue: z.number().nullable(),
    sapSpentHours: z.number().nullable(),
    rmaNumber: z.string(),
    caseNumber: z.string().nullable(),
    plannerStatus: z.string(),
    mappedStatus: z.string().nullable(),
    matched: z.boolean(),
  })),
})

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = userProfile as { id: string; role: string } | null
  if (!['staff_uk', 'staff_us', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = ConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { filename, rows } = parsed.data
  const matchedRows = rows.filter(r => r.matched && r.caseId)

  let updatedRows = 0

  for (const row of matchedRows) {
    if (!row.caseId) continue

    const updates: Record<string, unknown> = {}

    if (row.workshopStage) updates.workshop_stage = row.workshopStage
    if (row.clearHold)      updates.hold_reason = null
    if (row.holdReason)     updates.hold_reason = row.holdReason
    if (row.sapSalesOrder)  updates.sap_sales_order = row.sapSalesOrder
    if (row.sapWorksOrder)  updates.sap_works_order = row.sapWorksOrder
    if (row.sapEstimatedCompletion) updates.sap_estimated_completion = row.sapEstimatedCompletion
    if (row.sapOrderValue != null)  updates.sap_order_value = row.sapOrderValue
    if (row.sapSpentHours != null)  updates.sap_spent_hours = row.sapSpentHours

    if (Object.keys(updates).length === 0) continue

    const { error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', row.caseId)

    if (!error) updatedRows++
  }

  // Write import log
  await supabase.from('import_logs').insert({
    filename,
    uploaded_by: profile?.id ?? null,
    total_rows: rows.length,
    matched_rows: matchedRows.length,
    updated_rows: updatedRows,
    rows_data: rows as unknown as ImportPreviewRow[],
  })

  return NextResponse.json({ updatedRows, matchedRows: matchedRows.length })
}
