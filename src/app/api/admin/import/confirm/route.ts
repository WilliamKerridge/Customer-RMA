import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { requireStaff } from '@/lib/auth-helpers'
import { mapPlannerBucket } from '@/lib/import/stage-mapper'
import type { ImportPreviewRow } from '../parse/route'

// Only the file-derived fields are trusted from the client. The
// workshop_stage / hold_reason that actually get written are RE-DERIVED
// server-side from plannerStatus via mapPlannerBucket — the client cannot
// inject an arbitrary stage or hold reason (e.g. CREDIT_HELD) onto a case.
// The case match is likewise re-resolved from rmaNumber, not trusted.
const ConfirmSchema = z.object({
  filename: z.string().min(1),
  rows: z.array(z.object({
    sapSalesOrder: z.string().nullable(),
    sapWorksOrder: z.string().nullable(),
    sapEstimatedCompletion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    sapOrderValue: z.number().nullable(),
    sapSpentHours: z.number().nullable(),
    rmaNumber: z.string(),
    plannerStatus: z.string(),
  })),
})

export async function PUT(request: NextRequest) {
  const user = await requireStaff()
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()

  const body = await request.json()
  const parsed = ConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { filename, rows } = parsed.data

  // Re-resolve RMA -> case server-side instead of trusting client caseIds.
  const rmaNumbers = rows.map(r => r.rmaNumber.trim()).filter(Boolean)
  const { data: cases } = await supabase
    .from('cases')
    .select('id, rma_number')
    .in('rma_number', rmaNumbers)
  const caseIdByRma = new Map((cases ?? []).map(c => [c.rma_number ?? '', c.id]))

  let updatedRows = 0
  let matchedRows = 0

  for (const row of rows) {
    const caseId = caseIdByRma.get(row.rmaNumber.trim())
    if (!caseId) continue
    matchedRows++

    // Re-derive stage / hold from the planner status — never trust the client.
    const mapped = row.plannerStatus ? mapPlannerBucket(row.plannerStatus) : null

    const updates: Record<string, unknown> = {}
    if (mapped?.workshop_stage) updates.workshop_stage = mapped.workshop_stage
    if (mapped?.clear_hold)     updates.hold_reason = null
    else if (mapped?.hold_reason) updates.hold_reason = mapped.hold_reason
    if (row.sapSalesOrder)  updates.sap_sales_order = row.sapSalesOrder
    if (row.sapWorksOrder)  updates.sap_works_order = row.sapWorksOrder
    if (row.sapEstimatedCompletion) updates.sap_estimated_completion = row.sapEstimatedCompletion
    if (row.sapOrderValue != null)  updates.sap_order_value = row.sapOrderValue
    if (row.sapSpentHours != null)  updates.sap_spent_hours = row.sapSpentHours

    if (Object.keys(updates).length === 0) continue

    const { error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)

    if (!error) updatedRows++
  }

  // Write import log
  await supabase.from('import_logs').insert({
    filename,
    uploaded_by: user.canonicalId,
    total_rows: rows.length,
    matched_rows: matchedRows,
    updated_rows: updatedRows,
    rows_data: rows as unknown as ImportPreviewRow[],
  })

  return NextResponse.json({ updatedRows, matchedRows })
}
