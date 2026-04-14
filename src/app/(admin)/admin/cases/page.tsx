import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { WorkshopStageLabel } from '@/types/workshop'
import type { WorkshopStage } from '@/types/workshop'

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

const STATUS_DOT: Record<string, string> = {
  SUBMITTED: 'bg-blue',
  UNDER_REVIEW: 'bg-amber-400',
  AWAITING_PAYMENT: 'bg-orange-400',
  RMA_ISSUED: 'bg-purple-400',
  PARTS_RECEIVED: 'bg-cyan-400',
  IN_REPAIR: 'bg-blue',
  QUALITY_CHECK: 'bg-indigo-400',
  READY_TO_RETURN: 'bg-teal-400',
  CLOSED: 'bg-green-500',
  REJECTED: 'bg-red-400',
}

const ALL_STATUSES = [
  'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'RMA_ISSUED',
  'PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN',
  'CLOSED', 'REJECTED',
]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
}

interface Props {
  searchParams: Promise<{ search?: string; status?: string; office?: string }>
}

export default async function AdminAllCasesPage({ searchParams }: Props) {
  const { search = '', status: statusFilter = '', office: officeFilter = '' } = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/cases')

  const supabase = createServiceClient()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, office')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role ?? 'staff_uk'
  const userOffice = (userProfile as { office: string | null } | null)?.office ?? 'UK'

  if (!['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/')

  let query = supabase
    .from('cases')
    .select(`
      id, case_number, status, fault_type, workshop_stage,
      is_on_hold, hold_reason, required_return_date, sap_estimated_completion,
      office, created_at, updated_at,
      case_products ( product_id, products ( display_name ) )
    `)
    .order('updated_at', { ascending: false })

  // Staff only see their office unless admin
  if (role !== 'admin') {
    query = query.eq('office', userOffice as 'UK' | 'US')
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  if (officeFilter && role === 'admin') {
    query = query.eq('office', officeFilter as 'UK' | 'US')
  }

  const { data: cases } = await query
  type RawCase = NonNullable<typeof cases>[number]

  // Apply search in-memory (cross-join filter not possible server-side here)
  let filtered = cases ?? []
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((c) =>
      c.case_number?.toLowerCase().includes(q) ||
      c.fault_type?.toLowerCase().includes(q)
    )
  }

  const openCount = filtered.filter(
    (c) => !['CLOSED', 'REJECTED'].includes(c.status)
  ).length

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-text">All Cases</h1>
          <p className="text-[13px] text-grey-500 mt-0.5">
            {filtered.length} case{filtered.length !== 1 ? 's' : ''}{openCount > 0 ? ` · ${openCount} open` : ''}
            {role === 'admin' ? '' : ` · ${userOffice} queue`}
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Case
        </Link>
      </div>

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-5">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by case ID or fault type…"
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-grey-200 rounded-lg text-[13px] text-text bg-white outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 transition-all"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="px-3 py-2 border border-grey-200 rounded-lg text-[13px] bg-white text-grey-700 outline-none focus:border-blue"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {role === 'admin' && (
          <select
            name="office"
            defaultValue={officeFilter}
            className="px-3 py-2 border border-grey-200 rounded-lg text-[13px] bg-white text-grey-700 outline-none focus:border-blue"
          >
            <option value="">All Offices</option>
            <option value="UK">UK</option>
            <option value="US">US</option>
          </select>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-grey-100 text-grey-700 hover:bg-grey-200 transition-all"
        >
          Filter
        </button>
        {(search || statusFilter || officeFilter) && (
          <Link
            href="/admin/cases"
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-grey-500 hover:text-grey-700 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Cases table */}
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-grey-50 border-b border-grey-100">
                {['Case ID', 'Customer / Products', 'Office', 'Workshop Stage', 'Status', 'Est. Completion', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-grey-400 uppercase tracking-[0.06em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {filtered.map((c: RawCase) => {
                const isActionRequired = c.is_on_hold && c.hold_reason === 'AWAITING_CUSTOMER'
                const productNames = ((c.case_products as { products: { display_name: string } | null }[] | null) ?? [])
                  .map((cp) => cp.products?.display_name)
                  .filter((n): n is string => !!n)
                const overdue = isOverdue(c.required_return_date)

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-grey-50 transition-colors ${
                      isActionRequired ? 'bg-orange-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        <span className="font-mono text-[12px] font-semibold text-blue hover:underline">
                          {c.case_number}
                        </span>
                        {isActionRequired && (
                          <span className="ml-2 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                            Action Required
                          </span>
                        )}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        {productNames.length === 0 ? (
                          <div className="text-[13px] text-grey-400">—</div>
                        ) : productNames.length === 1 ? (
                          <div className="text-[13px] text-text font-medium">{productNames[0]}</div>
                        ) : (
                          <div className="space-y-0.5">
                            {productNames.map((name, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-grey-300 flex-shrink-0" />
                                <span className="text-[12px] text-text font-medium">{name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-grey-400 font-mono mt-0.5">{c.fault_type}</div>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        <span className="text-[12px] text-grey-600">{c.office}</span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        <span className="text-[12px] text-grey-600">
                          {c.workshop_stage
                            ? (WorkshopStageLabel[c.workshop_stage as WorkshopStage] ?? c.workshop_stage)
                            : '—'}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        <span className="inline-flex items-center gap-1.5 text-[12px]">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[c.status] ?? 'bg-grey-300'}`} />
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="block">
                        <span className={`text-[12px] ${overdue ? 'text-red-600 font-semibold' : 'text-grey-600'}`}>
                          {formatDate(c.sap_estimated_completion) ?? formatDate(c.required_return_date) ?? '—'}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.status === 'SUBMITTED' && (
                          <Link
                            href={`/admin/cases/${c.id}`}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all"
                          >
                            Review
                          </Link>
                        )}
                        <Link
                          href={`/admin/cases/${c.id}`}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-grey-50 text-grey-600 border border-grey-200 hover:bg-grey-100 transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-grey-400">
                    {search || statusFilter || officeFilter
                      ? 'No cases match your filters.'
                      : 'No cases yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
