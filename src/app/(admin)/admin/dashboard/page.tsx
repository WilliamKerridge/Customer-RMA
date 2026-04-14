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

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/dashboard')

  const supabase = createServiceClient()

  // Look up by email — better-auth IDs differ from public.users UUIDs
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, office')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role ?? 'staff_uk'
  const office = (userProfile as { office: string | null } | null)?.office ?? 'UK'

  // Fetch cases filtered by office role
  let query = supabase
    .from('cases')
    .select(`
      id, case_number, status, fault_type, workshop_stage,
      is_on_hold, hold_reason, hold_customer_label,
      required_return_date, sap_estimated_completion,
      office, created_at, updated_at,
      customer_id,
      case_products ( product_id, products ( display_name ) )
    `)
    .order('updated_at', { ascending: false })

  if (role !== 'admin') {
    query = query.eq('office', office as 'UK' | 'US')
  }

  const { data: cases } = await query

  type RawCase = NonNullable<typeof cases>[number]

  // Stats
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const newThisWeek = cases?.filter((c) => new Date(c.created_at) >= weekAgo).length ?? 0
  const awaitingAction = cases?.filter((c) =>
    ['SUBMITTED', 'AWAITING_PAYMENT'].includes(c.status) ||
    (c.is_on_hold && c.hold_reason === 'AWAITING_CUSTOMER')
  ).length ?? 0
  const inWorkshop = cases?.filter((c) => c.status === 'IN_REPAIR').length ?? 0
  const closedThisMonth = cases?.filter(
    (c) => c.status === 'CLOSED' && new Date(c.updated_at) >= monthStart
  ).length ?? 0

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-heading text-[22px] font-bold text-text">Dashboard</h1>
        <p className="text-[13px] text-grey-500 mt-0.5">
          {role === 'admin' ? 'All offices' : `${office} case queue`}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'New This Week', value: newThisWeek, colour: 'border-blue' },
          { label: 'Awaiting Action', value: awaitingAction, colour: 'border-orange-400' },
          { label: 'In Workshop', value: inWorkshop, colour: 'border-purple-400' },
          { label: 'Closed This Month', value: closedThisMonth, colour: 'border-green-400' },
        ].map(({ label, value, colour }) => (
          <div key={label} className={`bg-white rounded-xl border border-grey-200 shadow-sm pt-3 pb-4 px-5 border-t-[3px] ${colour}`}>
            <div className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1">{label}</div>
            <div className="font-heading text-[28px] font-bold text-text">{value}</div>
          </div>
        ))}
      </div>

      {/* Cases table */}
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">Case Queue</h2>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-blue text-white hover:bg-blue-light transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Case
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-grey-50 border-b border-grey-100">
                {['Case ID', 'Customer / Products', 'Workshop Stage', 'Status', 'Est. Completion', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-grey-400 uppercase tracking-[0.06em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {(cases ?? []).map((c: RawCase) => {
                const isActionRequired = c.is_on_hold && c.hold_reason === 'AWAITING_CUSTOMER'
                const productName = (c.case_products as { products: { display_name: string } | null }[] | null)?.[0]?.products?.display_name ?? '—'
                const overdue = isOverdue(c.required_return_date)

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-grey-50 transition-colors cursor-pointer ${
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
                        <div className="text-[13px] text-text font-medium">{productName}</div>
                        <div className="text-[11px] text-grey-400 font-mono mt-0.5">{c.fault_type}</div>
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

              {(cases ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-grey-400">
                    No cases in queue.
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
