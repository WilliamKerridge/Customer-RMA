import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export interface AccountPreviewRow {
  email: string
  fullName: string | null
  company: string | null
  phone: string | null
  companyName: string | null
  creditTerms: boolean
  poRequired: boolean
  accountActive: boolean
  notes: string | null
  existingUserId: string | null
  existingAccountId: string | null
  /** 'create' = no existing user, 'update' = user already exists */
  action: 'create' | 'update'
  /** true if email is missing or malformed */
  invalid: boolean
}

function parseBool(val: unknown, defaultVal = false): boolean {
  if (val == null) return defaultVal
  const s = String(val).trim().toLowerCase()
  return ['yes', 'true', '1', 'y'].includes(s)
}

function orNull(val: unknown): string | null {
  const s = String(val ?? '').trim()
  return s || null
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
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  if (rows.length === 0) {
    return NextResponse.json({ message: 'The spreadsheet contains no data rows' }, { status: 400 })
  }

  // Collect emails for batch lookup
  const emails = rows
    .map(r => String(r['Email'] ?? '').trim().toLowerCase())
    .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email')
    .in('email', emails)

  const { data: existingAccounts } = await supabase
    .from('customer_accounts')
    .select('id, user_id')
    .in('user_id', (existingUsers ?? []).map(u => u.id))

  const userByEmail = new Map((existingUsers ?? []).map(u => [u.email.toLowerCase(), u]))
  const accountByUserId = new Map((existingAccounts ?? []).map(a => [a.user_id, a]))

  const preview: AccountPreviewRow[] = rows.map(row => {
    const rawEmail = String(row['Email'] ?? '').trim()
    const emailLower = rawEmail.toLowerCase()
    const invalid = !rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)

    const existing = userByEmail.get(emailLower) ?? null
    const existingAccount = existing ? (accountByUserId.get(existing.id) ?? null) : null

    return {
      email: rawEmail,
      fullName:      orNull(row['Full Name']),
      company:       orNull(row['Company']),
      phone:         orNull(row['Phone']),
      companyName:   orNull(row['Company Name']) ?? orNull(row['Company']),
      creditTerms:   parseBool(row['Credit Terms']),
      poRequired:    parseBool(row['PO Required']),
      accountActive: parseBool(row['Account Active'], true),
      notes:         orNull(row['Notes']),
      existingUserId:    existing?.id ?? null,
      existingAccountId: existingAccount?.id ?? null,
      action: existing ? 'update' : 'create',
      invalid,
    }
  })

  const validRows    = preview.filter(r => !r.invalid)
  const createCount  = validRows.filter(r => r.action === 'create').length
  const updateCount  = validRows.filter(r => r.action === 'update').length

  return NextResponse.json({
    filename: file.name,
    totalRows: preview.length,
    validRows: validRows.length,
    createCount,
    updateCount,
    rows: preview,
  })
}
