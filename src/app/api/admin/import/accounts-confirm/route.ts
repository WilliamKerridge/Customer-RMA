import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const RowSchema = z.object({
  email:             z.string().email(),
  fullName:          z.string().nullable(),
  company:           z.string().nullable(),
  phone:             z.string().nullable(),
  companyName:       z.string().nullable(),
  creditTerms:       z.boolean(),
  poRequired:        z.boolean(),
  accountActive:     z.boolean(),
  notes:             z.string().nullable(),
  existingUserId:    z.string().nullable(),
  existingAccountId: z.string().nullable(),
  action:            z.enum(['create', 'update']),
  invalid:           z.boolean(),
})

const ConfirmSchema = z.object({
  filename: z.string().min(1),
  rows: z.array(RowSchema),
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

  const validRows = parsed.data.rows.filter(r => !r.invalid)
  let createdCount = 0
  let updatedCount = 0

  for (const row of validRows) {
    if (row.action === 'create') {
      // Insert user profile
      const { data: newUser, error: userErr } = await supabase
        .from('users')
        .insert({
          email:     row.email.toLowerCase(),
          full_name: row.fullName,
          company:   row.company,
          phone:     row.phone,
          role:      'customer',
        })
        .select('id')
        .single()

      if (userErr || !newUser) {
        console.error('Account import: failed to create user', row.email, userErr)
        continue
      }

      // Insert customer account
      const { error: accErr } = await supabase
        .from('customer_accounts')
        .insert({
          user_id:        newUser.id,
          company_name:   row.companyName,
          credit_terms:   row.creditTerms,
          po_required:    row.poRequired,
          account_active: row.accountActive,
          notes:          row.notes,
        })

      if (accErr) {
        console.error('Account import: failed to create account for', row.email, accErr)
      } else {
        createdCount++
      }
    } else {
      // Update existing user profile
      const { error: userErr } = await supabase
        .from('users')
        .update({
          full_name: row.fullName,
          company:   row.company,
          phone:     row.phone,
        })
        .eq('id', row.existingUserId!)

      if (userErr) {
        console.error('Account import: failed to update user', row.email, userErr)
        continue
      }

      if (row.existingAccountId) {
        // Update existing account
        await supabase
          .from('customer_accounts')
          .update({
            company_name:   row.companyName,
            credit_terms:   row.creditTerms,
            po_required:    row.poRequired,
            account_active: row.accountActive,
            notes:          row.notes,
          })
          .eq('id', row.existingAccountId)
      } else {
        // Create account for existing user that didn't have one
        await supabase
          .from('customer_accounts')
          .insert({
            user_id:        row.existingUserId!,
            company_name:   row.companyName,
            credit_terms:   row.creditTerms,
            po_required:    row.poRequired,
            account_active: row.accountActive,
            notes:          row.notes,
          })
      }

      updatedCount++
    }
  }

  // Log to import_logs
  await supabase.from('import_logs').insert({
    filename:      `[accounts] ${parsed.data.filename}`,
    uploaded_by:   profile?.id ?? null,
    total_rows:    parsed.data.rows.length,
    matched_rows:  validRows.filter(r => r.action === 'update').length,
    updated_rows:  createdCount + updatedCount,
    rows_data:     parsed.data.rows,
  })

  return NextResponse.json({ createdCount, updatedCount })
}
