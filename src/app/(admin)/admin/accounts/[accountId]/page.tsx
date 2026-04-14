import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import AccountDetailForm from '@/components/admin/AccountDetailForm'
import { ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ accountId: string }>
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  AWAITING_PAYMENT: 'Awaiting Payment',
  RMA_ISSUED: 'RMA Issued',
  PARTS_RECEIVED: 'Parts Received',
  IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check',
  READY_TO_RETURN: 'Ready to Return',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

export default async function AccountDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role
  if (!role || !['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/login')

  const { accountId } = await params

  const { data: account, error } = await supabase
    .from('customer_accounts')
    .select('*, users ( id, full_name, email, company, phone, role, created_at )')
    .eq('id', accountId)
    .single()

  if (error || !account) notFound()

  const linkedUser = (account.users as unknown) as {
    id: string
    full_name: string | null
    email: string | null
    company: string | null
    phone: string | null
    role: string | null
    created_at: string | null
  } | null

  // Fetch cases for this account
  let cases: {
    id: string
    case_number: string
    status: string
    fault_type: string
    created_at: string
    case_products: { products: { display_name: string } | null }[]
  }[] = []
  let totalCases = 0
  let openCases = 0
  let lastCaseDate: string | null = null

  if (linkedUser?.id) {
    const { data: allCases } = await supabase
      .from('cases')
      .select('id, case_number, status, fault_type, created_at, case_products ( products ( display_name ) )')
      .eq('customer_id', linkedUser.id)
      .order('created_at', { ascending: false })

    totalCases = allCases?.length ?? 0
    openCases = (allCases ?? []).filter((c) => !['CLOSED', 'REJECTED'].includes(c.status)).length
    lastCaseDate = allCases?.[0]?.created_at ?? null
    cases = (allCases ?? []).slice(0, 10) as typeof cases
  }

  return (
    <div className="px-8 py-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-grey-400 font-mono mb-5">
        <Link href="/admin/accounts" className="hover:text-text transition-colors">Customer Accounts</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-grey-600">{linkedUser?.full_name ?? linkedUser?.email ?? 'Account'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white flex-shrink-0"
          style={{ background: '#0066cc' }}
        >
          {linkedUser?.full_name
            ? linkedUser.full_name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
            : '?'}
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-['Space_Grotesk'] text-[20px] font-bold text-text">
              {linkedUser?.full_name ?? 'Unknown'}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              account.account_active
                ? 'bg-green-50 text-green-700'
                : 'bg-grey-100 text-grey-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${account.account_active ? 'bg-green-500' : 'bg-grey-400'}`} />
              {account.account_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-[13px] text-grey-500 mt-0.5">
            {account.company_name ?? linkedUser?.company ?? '—'}{linkedUser?.email ? ` · ${linkedUser.email}` : ''}
          </p>
        </div>
      </div>

      <AccountDetailForm
        account={{
          id: account.id,
          user_id: account.user_id,
          company_name: account.company_name,
          billing_address: account.billing_address as Record<string, unknown> | null,
          credit_terms: account.credit_terms,
          po_required: account.po_required,
          account_active: account.account_active,
          notes: account.notes,
          created_at: account.created_at,
        }}
        user={linkedUser}
        cases={cases}
        totalCases={totalCases}
        openCases={openCases}
        lastCaseDate={lastCaseDate}
        statusLabels={STATUS_LABELS}
        isAdmin={role === 'admin'}
      />
    </div>
  )
}
