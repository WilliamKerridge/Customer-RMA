import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import AccountsTable, { type AccountRow } from '@/components/admin/AccountsTable'
import { Users, CreditCard, FileText, FolderOpen, Plus } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ search?: string; credit?: string; active?: string }>
}

export default async function AdminAccountsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/accounts')

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role
  if (!role || !['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/login')

  const { search = '', credit = '', active = '' } = await searchParams

  // Fetch accounts with linked user info
  let query = supabase
    .from('customer_accounts')
    .select('*, users ( id, full_name, email, company, phone )')
    .order('created_at', { ascending: false })

  if (active === 'true') query = query.eq('account_active', true)
  else if (active === 'false') query = query.eq('account_active', false)

  if (credit === 'true') query = query.eq('credit_terms', true)
  else if (credit === 'false') query = query.eq('credit_terms', false)

  type RawAccount = {
    id: string
    user_id: string | null
    company_name: string | null
    credit_terms: boolean
    po_required: boolean
    account_active: boolean
    notes: string | null
    created_at: string
    users: unknown
  }

  const rawAccounts = (await query).data ?? []
  let accounts = rawAccounts as unknown as RawAccount[]

  type UserRef = { id: string; full_name?: string | null; email?: string | null; company?: string | null }

  // Apply search filter
  if (search) {
    const q = search.toLowerCase()
    accounts = accounts.filter((a) => {
      const u = a.users as UserRef | null
      return (
        u?.full_name?.toLowerCase().includes(q) ||
        u?.email?.toLowerCase().includes(q) ||
        u?.company?.toLowerCase().includes(q) ||
        a.company_name?.toLowerCase().includes(q)
      )
    })
  }

  // Fetch case counts
  const userIds = accounts.map((a) => (a.users as UserRef | null)?.id).filter(Boolean) as string[]
  const caseCountMap: Record<string, { total: number; open: number }> = {}

  if (userIds.length > 0) {
    const { data: cases } = await supabase
      .from('cases')
      .select('customer_id, status')
      .in('customer_id', userIds)

    for (const c of cases ?? []) {
      const acct = accounts.find((a) => (a.users as UserRef | null)?.id === c.customer_id)
      if (!acct) continue
      if (!caseCountMap[acct.id]) caseCountMap[acct.id] = { total: 0, open: 0 }
      caseCountMap[acct.id].total++
      if (!['CLOSED', 'REJECTED'].includes(c.status)) {
        caseCountMap[acct.id].open++
      }
    }
  }

  const accountList: AccountRow[] = accounts.map((a) => ({
    id: a.id,
    user_id: a.user_id,
    company_name: a.company_name,
    credit_terms: a.credit_terms,
    po_required: a.po_required,
    account_active: a.account_active,
    notes: a.notes,
    created_at: a.created_at,
    users: a.users as AccountRow['users'],
    totalCases: caseCountMap[a.id]?.total ?? 0,
    openCases: caseCountMap[a.id]?.open ?? 0,
  }))

  const total = accountList.length
  const withCredit = accountList.filter((a) => a.credit_terms).length
  const withPo = accountList.filter((a) => a.po_required).length
  const totalOpen = accountList.reduce((sum, a) => sum + a.openCases, 0)

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-['Space_Grotesk'] text-[22px] font-bold text-text mb-1">
            Customer Accounts
          </h1>
          <p className="text-[13px] text-grey-500">
            Manage credit terms, purchase order requirements, and account status for all customers.
          </p>
        </div>
        <Link
          href="/admin/accounts/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ml-6 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">Total Accounts</span>
          </div>
          <div className="text-[28px] font-bold text-text font-['Space_Grotesk']">{total}</div>
        </div>
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">Credit Terms</span>
          </div>
          <div className="text-[28px] font-bold text-text font-['Space_Grotesk']">{withCredit}</div>
          <div className="text-[12px] text-grey-400 mt-1">{total > 0 ? Math.round((withCredit / total) * 100) : 0}% of accounts</div>
        </div>
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">PO Required</span>
          </div>
          <div className="text-[28px] font-bold text-text font-['Space_Grotesk']">{withPo}</div>
          <div className="text-[12px] text-grey-400 mt-1">of credit accounts</div>
        </div>
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">Open Cases</span>
          </div>
          <div className="text-[28px] font-bold text-text font-['Space_Grotesk']">{totalOpen}</div>
          <div className="text-[12px] text-grey-400 mt-1">across all accounts</div>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name, company or email…"
            className="pl-9 pr-4 py-2 border border-grey-200 rounded-lg text-sm text-text bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-72"
          />
        </div>
        <select
          name="credit"
          defaultValue={credit}
          className="px-3 py-2 border border-grey-200 rounded-lg text-sm text-text bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Accounts</option>
          <option value="true">Credit Terms</option>
          <option value="false">No Credit Terms</option>
        </select>
        <select
          name="active"
          defaultValue={active}
          className="px-3 py-2 border border-grey-200 rounded-lg text-sm text-text bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Active &amp; Inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-grey-100 hover:bg-grey-200 text-sm font-medium text-grey-700 rounded-lg transition-all duration-150 cursor-pointer"
        >
          Filter
        </button>
        {(search || credit || active) && (
          <Link
            href="/admin/accounts"
            className="px-4 py-2 text-sm text-grey-500 hover:text-text transition-colors duration-150"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <AccountsTable initialAccounts={accountList} />
    </div>
  )
}
