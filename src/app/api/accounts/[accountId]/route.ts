import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { Json } from '@/types/database'

const patchSchema = z.object({
  company_name: z.string().optional().nullable(),
  billing_address: z.unknown().optional().nullable(),
  shipping_address: z.unknown().optional().nullable(),
  credit_terms: z.boolean().optional(),
  po_required: z.boolean().optional(),
  account_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  // user fields that can be updated alongside
  full_name: z.string().optional(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
})

async function requireStaff() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null

  return { ...session.user, canonicalId: profile.id, role: profile.role }
}

// GET — single account with user info + last 10 cases
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { accountId } = await params
    const supabase = createServiceClient()

    const { data: account, error } = await supabase
      .from('customer_accounts')
      .select('*, users ( id, full_name, email, company, phone, role, created_at )')
      .eq('id', accountId)
      .single()

    if (error || !account) return NextResponse.json({ message: 'Account not found' }, { status: 404 })

    const userId = (account.users as unknown as { id: string } | null)?.id
    let cases: unknown[] = []
    let totalCases = 0
    let openCases = 0

    if (userId) {
      const { data: allCases } = await supabase
        .from('cases')
        .select('id, case_number, status, fault_type, created_at, case_products ( products ( display_name ) )')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      totalCases = allCases?.length ?? 0
      openCases = (allCases ?? []).filter((c) => !['CLOSED', 'REJECTED'].includes(c.status)).length
      cases = (allCases ?? []).slice(0, 10)
    }

    return NextResponse.json({ account, cases, totalCases, openCases })
  } catch (err) {
    console.error('Account GET error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update account (and optionally linked user fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { accountId } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { full_name, phone, company, ...accountFields } = parsed.data
    const supabase = createServiceClient()

    // Update customer_accounts — cast address fields to Json type
    const { billing_address, shipping_address, ...simpleFields } = accountFields
    const updatePayload = {
      ...simpleFields,
      ...(billing_address !== undefined ? { billing_address: billing_address as Json } : {}),
      ...(shipping_address !== undefined ? { shipping_address: shipping_address as Json } : {}),
      updated_at: new Date().toISOString(),
    }
    const { data: account, error: accountError } = await supabase
      .from('customer_accounts')
      .update(updatePayload)
      .eq('id', accountId)
      .select('*, users ( id )')
      .single()

    if (accountError) {
      console.error('Account PATCH failed:', accountError)
      return NextResponse.json({ message: 'Failed to update account' }, { status: 500 })
    }

    // Update linked user fields if provided
    const userId = (account.users as unknown as { id: string } | null)?.id
    if (userId && (full_name !== undefined || phone !== undefined || company !== undefined)) {
      const userUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (full_name !== undefined) userUpdate.full_name = full_name
      if (phone !== undefined) userUpdate.phone = phone
      if (company !== undefined) userUpdate.company = company

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', userId)

      if (userError) console.error('User fields update failed (non-fatal):', userError)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Account PATCH error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
