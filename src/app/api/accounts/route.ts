import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { Json } from '@/types/database'

const createSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  company_name: z.string().optional().nullable(),
  billing_address: z.unknown().optional().nullable(),
  shipping_address: z.unknown().optional().nullable(),
  credit_terms: z.boolean().default(false),
  po_required: z.boolean().default(false),
  account_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
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

// GET — list accounts with user info joined
export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const creditFilter = searchParams.get('credit') ?? ''
    const activeFilter = searchParams.get('active') ?? ''

    const supabase = createServiceClient()

    let query = supabase
      .from('customer_accounts')
      .select(`
        *,
        users ( id, full_name, email, company, phone )
      `)
      .order('created_at', { ascending: false })

    if (activeFilter === 'true') {
      query = query.eq('account_active', true)
    } else if (activeFilter === 'false') {
      query = query.eq('account_active', false)
    }

    if (creditFilter === 'true') {
      query = query.eq('credit_terms', true)
    } else if (creditFilter === 'false') {
      query = query.eq('credit_terms', false)
    }

    const { data, error } = await query
    if (error) {
      console.error('Accounts GET failed:', error)
      return NextResponse.json({ message: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Apply search filter in memory (cross-relation filter)
    let accounts = data ?? []
    if (search) {
      const q = search.toLowerCase()
      accounts = accounts.filter((a) => {
        const u = a.users as { full_name?: string | null; email?: string | null; company?: string | null } | null
        return (
          u?.full_name?.toLowerCase().includes(q) ||
          u?.email?.toLowerCase().includes(q) ||
          u?.company?.toLowerCase().includes(q) ||
          a.company_name?.toLowerCase().includes(q)
        )
      })
    }

    // Fetch case counts per account
    const accountIds = accounts.map((a) => a.id)
    const caseCountMap: Record<string, { total: number; open: number }> = {}

    if (accountIds.length > 0) {
      const { data: cases } = await supabase
        .from('cases')
        .select('customer_id, status')
        .in('customer_id', accounts.map((a) => a.user_id).filter(Boolean) as string[])

      for (const c of cases ?? []) {
        const acct = accounts.find((a) => a.user_id === c.customer_id)
        if (!acct) continue
        if (!caseCountMap[acct.id]) caseCountMap[acct.id] = { total: 0, open: 0 }
        caseCountMap[acct.id].total++
        if (!['CLOSED', 'REJECTED'].includes(c.status)) {
          caseCountMap[acct.id].open++
        }
      }
    }

    const result = accounts.map((a) => ({
      ...a,
      totalCases: caseCountMap[a.id]?.total ?? 0,
      openCases: caseCountMap[a.id]?.open ?? 0,
    }))

    // Stats for header strip
    const total = result.length
    const withCredit = result.filter((a) => a.credit_terms).length
    const withPo = result.filter((a) => a.po_required).length
    const totalOpen = result.reduce((sum, a) => sum + a.openCases, 0)

    return NextResponse.json({ accounts: result, stats: { total, withCredit, withPo, totalOpen } })
  } catch (err) {
    console.error('Accounts GET error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

const createWithContactSchema = z.object({
  // Contact fields — used to look up or create a user record
  email: z.string().email('Valid email address required'),
  full_name: z.string().min(1, 'Full name is required'),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  // Account fields
  company_name: z.string().optional().nullable(),
  billing_address: z.unknown().optional().nullable(),
  credit_terms: z.boolean().default(false),
  po_required: z.boolean().default(false),
  account_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

// POST — create account (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin only' }, { status: 403 })

    const body = await request.json()

    // Support both the extended contact schema and the legacy schema
    const parsed = createWithContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { email, full_name, company, phone, billing_address, ...accountFields } = parsed.data

    // Look up existing user by email, or create a new customer user
    let userId: string | null = null
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      userId = (existingUser as { id: string }).id
      // Update user fields if they changed
      await supabase.from('users').update({
        full_name: full_name || null,
        company: company || null,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    } else {
      // Create a new user record (no auth account — staff-created)
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          full_name: full_name || null,
          company: company || null,
          phone: phone || null,
          role: 'customer',
        })
        .select('id')
        .single()

      if (userError || !newUser) {
        console.error('User create failed:', userError)
        return NextResponse.json({ message: 'Failed to create user record' }, { status: 500 })
      }
      userId = (newUser as { id: string }).id
    }

    // Check if this user already has an account
    const { data: existingAccount } = await supabase
      .from('customer_accounts')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingAccount) {
      return NextResponse.json(
        { message: 'An account for this email address already exists', accountId: (existingAccount as { id: string }).id },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('customer_accounts')
      .insert({
        user_id: userId,
        company_name: accountFields.company_name || null,
        credit_terms: accountFields.credit_terms,
        po_required: accountFields.po_required,
        account_active: accountFields.account_active,
        notes: accountFields.notes || null,
        billing_address: billing_address as Json ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Account create failed:', error)
      return NextResponse.json({ message: 'Failed to create account' }, { status: 500 })
    }

    return NextResponse.json({ account: data }, { status: 201 })
  } catch (err) {
    console.error('Accounts POST error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
