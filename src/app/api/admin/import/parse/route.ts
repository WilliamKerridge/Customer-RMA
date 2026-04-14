import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { mapPlannerBucket, describeMappedStatus } from '@/lib/import/stage-mapper'

export interface ImportPreviewRow {
  rmaNumber: string
  caseId: string | null
  caseNumber: string | null
  plannerStatus: string
  mappedStatus: string | null
  /** null = unrecognised bucket */
  workshopStage: string | null
  holdReason: string | null
  clearHold: boolean
  sapSalesOrder: string | null
  sapWorksOrder: string | null
  sapEstimatedCompletion: string | null
  sapOrderValue: number | null
  sapSpentHours: number | null
  matched: boolean
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  if (!['staff_uk', 'staff_us', 'admin'].includes((userProfile as { role: string } | null)?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 })

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ message: 'File must be an Excel spreadsheet (.xlsx or .xls)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  if (rows.length === 0) {
    return NextResponse.json({ message: 'The spreadsheet contains no data rows' }, { status: 400 })
  }

  // Collect all RMA numbers from the file to batch-query cases
  const rmaNumbers: string[] = rows
    .map(r => String(r['Description'] ?? '').trim())
    .filter(Boolean)

  const { data: cases } = await supabase
    .from('cases')
    .select('id, case_number, rma_number, workshop_stage, hold_reason')
    .in('rma_number', rmaNumbers)

  const caseByRma = new Map((cases ?? []).map(c => [c.rma_number ?? '', c]))

  const preview: ImportPreviewRow[] = rows.map(row => {
    const rmaNumber = String(row['Description'] ?? '').trim()
    const plannerStatus = String(row['Product Status'] ?? '').trim()
    const match = rmaNumber ? caseByRma.get(rmaNumber) ?? null : null
    const mapped = plannerStatus ? mapPlannerBucket(plannerStatus) : null

    // Parse dates from XLSX — may come back as Date object or string
    let sapEstimatedCompletion: string | null = null
    const rawDate = row['Estimated Completion']
    if (rawDate instanceof Date) {
      sapEstimatedCompletion = rawDate.toISOString().split('T')[0]
    } else if (typeof rawDate === 'string' && rawDate.trim()) {
      sapEstimatedCompletion = rawDate.trim()
    }

    const sapOrderValue = row['Value'] != null ? Number(row['Value']) : null
    const sapSpentHours = row['Spent Hours'] != null ? Number(row['Spent Hours']) : null

    return {
      rmaNumber,
      caseId: match?.id ?? null,
      caseNumber: match?.case_number ?? null,
      plannerStatus,
      mappedStatus: mapped ? describeMappedStatus(mapped) : null,
      workshopStage: mapped?.workshop_stage ?? null,
      holdReason: mapped?.hold_reason ?? null,
      clearHold: mapped?.clear_hold ?? false,
      sapSalesOrder: row['Sales Order'] != null ? String(row['Sales Order']).trim() : null,
      sapWorksOrder: row['Service Order'] != null ? String(row['Service Order']).trim() : null,
      sapEstimatedCompletion,
      sapOrderValue: isNaN(sapOrderValue!) ? null : sapOrderValue,
      sapSpentHours: isNaN(sapSpentHours!) ? null : sapSpentHours,
      matched: !!match,
    }
  })

  return NextResponse.json({
    filename: file.name,
    totalRows: preview.length,
    matchedRows: preview.filter(r => r.matched).length,
    rows: preview,
  })
}
