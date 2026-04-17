import { Fragment } from 'react'
import { redirect } from 'next/navigation'
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

// Statuses shown in the detail table (physically in/near workshop)
const WORKSHOP_STATUSES = ['PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN'] as const

// All open (non-terminal) statuses — used for pipeline stats
const OPEN_STATUSES = [
  'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT',
  'RMA_ISSUED', 'PARTS_RECEIVED', 'IN_REPAIR',
  'QUALITY_CHECK', 'READY_TO_RETURN',
] as const

type TimelineEntry = {
  label: string
  days: number       // working days (Mon–Fri), excludes weekends
  isCurrent: boolean
}

/** Count weekdays (Mon–Fri) between two dates, exclusive of the end date. */
function workingDaysBetween(start: Date, end: Date): number {
  let count = 0
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endMidnight = new Date(end)
  endMidnight.setHours(0, 0, 0, 0)
  while (cursor < endMidnight) {
    const dow = cursor.getDay() // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

function buildCaseTimeline(
  caseCreatedAt: string,
  currentStatus: string,
  currentWorkshopStage: string | null,
  updates: Array<{ status_change_to: string | null; content: string; created_at: string }>
): TimelineEntry[] {
  // Include status transitions AND case-level workshop stage transitions.
  // The 'Workshop stage updated to' prefix is set by src/app/api/cases/[caseId]/stage/route.ts —
  // if that content string ever changes, update this filter too.
  const transitions = updates
    .filter(u => u.status_change_to !== null || u.content.startsWith('Workshop stage updated to'))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const entries: TimelineEntry[] = []
  let prevLabel = 'Submitted'
  let prevTime = new Date(caseCreatedAt)

  for (const u of transitions) {
    const exitTime = new Date(u.created_at)
    const days = workingDaysBetween(prevTime, exitTime)
    entries.push({ label: prevLabel, days, isCurrent: false })

    if (u.status_change_to) {
      prevLabel = STATUS_LABELS[u.status_change_to] ?? u.status_change_to
    } else {
      // "Workshop stage updated to In Rework."
      const m = u.content.match(/^Workshop stage updated to (.+)\.$/)
      prevLabel = m?.[1] ?? 'Unknown'
    }
    prevTime = exitTime
  }

  // Current entry
  const currentLabel = currentWorkshopStage
    ? (WorkshopStageLabel[currentWorkshopStage as WorkshopStage] ?? currentWorkshopStage)
    : (STATUS_LABELS[currentStatus] ?? currentStatus)
  const daysAtCurrent = workingDaysBetween(prevTime, new Date())
  entries.push({ label: currentLabel, days: daysAtCurrent, isCurrent: true })

  return entries
}

function daysColour(days: number): string {
  if (days > 5) return 'text-red-600 font-semibold'
  if (days > 2) return 'text-amber-700'
  return 'text-grey-600'
}

function totalAgeColour(days: number): string {
  if (days > 20) return 'text-red-600 font-semibold'
  if (days > 10) return 'text-amber-700'
  return 'text-grey-600'
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/reports')

  const supabase = createServiceClient()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, office')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role ?? 'staff_uk'
  const office = (userProfile as { office: string | null } | null)?.office ?? 'UK'

  if (!['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/')

  // ── Query 1: all open cases (for pipeline stats only — id + status)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let openQuery: any = supabase
    .from('cases')
    .select('id, status')
    .in('status', [...OPEN_STATUSES])
  if (role !== 'admin') openQuery = openQuery.eq('office', office as 'UK' | 'US')
  const { data: allOpenCases } = await openQuery

  // Pipeline counts per status
  const pipelineCounts = Object.fromEntries(
    OPEN_STATUSES.map((s) => [s, 0])
  ) as Record<string, number>
  for (const c of allOpenCases ?? []) {
    if (c.status in pipelineCounts) pipelineCounts[c.status]++
  }

  const PIPELINE_STATS = [
    { label: 'Awaiting Review',  value: pipelineCounts.SUBMITTED + pipelineCounts.UNDER_REVIEW, colour: 'border-blue' },
    { label: 'Awaiting Payment', value: pipelineCounts.AWAITING_PAYMENT, colour: 'border-orange-400' },
    { label: 'RMA Issued',       value: pipelineCounts.RMA_ISSUED, colour: 'border-purple-400' },
    { label: 'In Workshop',      value: pipelineCounts.PARTS_RECEIVED + pipelineCounts.IN_REPAIR + pipelineCounts.QUALITY_CHECK + pipelineCounts.READY_TO_RETURN, colour: 'border-cyan-400' },
  ]

  // ── Query 2: workshop cases with product and hold info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workshopQuery: any = supabase
    .from('cases')
    .select(`
      id, case_number, rma_number, status, office, workshop_stage,
      is_on_hold, hold_reason, hold_customer_label,
      sap_estimated_completion, required_return_date,
      created_at, updated_at,
      customer_id,
      case_products(
        id, workshop_stage, status,
        products(display_name)
      )
    `)
    .in('status', [...WORKSHOP_STATUSES])
    .order('created_at', { ascending: true })
  if (role !== 'admin') workshopQuery = workshopQuery.eq('office', office as 'UK' | 'US')
  const { data: workshopCases } = await workshopQuery

  // ── Query 3: case_updates for those cases (stage + status transitions)
  const caseIds = (workshopCases ?? []).map((c: { id: string }) => c.id)
  const { data: allUpdates } = caseIds.length > 0
    ? await supabase
        .from('case_updates')
        .select('case_id, status_change_to, content, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: true })
    : { data: [] as Array<{ case_id: string | null; status_change_to: string | null; content: string; created_at: string }> }

  // Group updates by case
  const updatesByCaseId = new Map<string, Array<{ status_change_to: string | null; content: string; created_at: string }>>()
  for (const u of allUpdates ?? []) {
    if (!u.case_id) continue
    const list = updatesByCaseId.get(u.case_id) ?? []
    list.push({ status_change_to: u.status_change_to, content: u.content, created_at: u.created_at })
    updatesByCaseId.set(u.case_id, list)
  }

  // ── Query 4: customer names
  const customerIds: string[] = [
    ...new Set<string>(
      (workshopCases ?? [])
        .map((c: { customer_id: string | null }) => c.customer_id)
        .filter((id: string | null): id is string => id !== null)
    ),
  ]
  const { data: customers } = customerIds.length > 0
    ? await supabase.from('users').select('id, full_name, company').in('id', customerIds)
    : { data: [] as Array<{ id: string; full_name: string | null; company: string | null }> }
  const customerMap = new Map((customers ?? []).map((u) => [u.id, u]))

  type WorkshopCase = NonNullable<typeof workshopCases>[number]

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-heading text-[22px] font-bold text-text">Reports</h1>
        <p className="text-[13px] text-grey-500 mt-0.5">
          {role === 'admin' ? 'All offices' : `${office} workshop queue`}
        </p>
      </div>

      {/* Pipeline summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PIPELINE_STATS.map(({ label, value, colour }) => (
          <div key={label} className={`bg-white rounded-xl border border-grey-200 shadow-sm pt-3 pb-4 px-5 border-t-[3px] ${colour}`}>
            <div className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1">{label}</div>
            <div className="font-heading text-[28px] font-bold text-text">{value}</div>
          </div>
        ))}
      </div>

      {/* In-workshop repairs table */}
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">In Workshop</h2>
          <span className="text-[12px] text-grey-400">{(workshopCases ?? []).length} active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-grey-50 border-b border-grey-100">
                {['Case / RMA', 'Customer', 'Products', 'Stage', 'Working Days at Stage', 'Total Working Days', 'Est. Completion', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-grey-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(workshopCases ?? []).map((c: WorkshopCase) => {
                const customer = c.customer_id ? customerMap.get(c.customer_id) : null
                const updates = updatesByCaseId.get(c.id) ?? []
                const timeline = buildCaseTimeline(c.created_at, c.status, c.workshop_stage, updates)
                const current = timeline[timeline.length - 1]
                const totalDays = workingDaysBetween(new Date(c.created_at), new Date())

                // Product display names (case_products joined to products)
                const productNames = (c.case_products as Array<{ products: { display_name: string } | null }> | null)
                  ?.map((cp) => cp.products?.display_name)
                  .filter(Boolean)
                  .join(', ') ?? '—'

                const estCompletion = c.sap_estimated_completion ?? c.required_return_date
                const isOverdue = estCompletion ? new Date(estCompletion).getTime() < Date.now() : false

                return (
                  <Fragment key={c.id}>
                    {/* Main row */}
                    <tr className="border-t border-grey-100 hover:bg-grey-50 transition-colors">
                      <td className="px-4 pt-3 pb-1 align-top">
                        <a href={`/admin/cases/${c.id}`} className="block">
                          <div className="font-mono text-[12px] font-semibold text-blue hover:underline">{c.case_number}</div>
                          {c.rma_number && (
                            <div className="font-mono text-[11px] text-grey-400 mt-0.5">{c.rma_number}</div>
                          )}
                        </a>
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <div className="text-[13px] text-text">{customer?.full_name ?? '—'}</div>
                        {customer?.company && (
                          <div className="text-[11px] text-grey-400 mt-0.5">{customer.company}</div>
                        )}
                        {c.office === 'US' && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">US</span>
                        )}
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <div className="text-[12px] text-grey-700">{productNames}</div>
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <div className="text-[12px] font-semibold text-text">{current.label}</div>
                        {c.is_on_hold && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              On Hold
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <span className={`text-[13px] font-mono ${daysColour(current.days)}`}>
                          {current.days === 0 ? '< 1wd' : `${current.days}wd`}
                        </span>
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <span className={`text-[13px] font-mono ${totalAgeColour(totalDays)}`}>
                          {totalDays === 0 ? '< 1wd' : `${totalDays}wd`}
                        </span>
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        {estCompletion ? (
                          <span className={`text-[12px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-grey-600'}`}>
                            {formatDate(estCompletion)}
                            {isOverdue && <span className="ml-1 text-[10px] text-red-500">overdue</span>}
                          </span>
                        ) : (
                          <span className="text-[12px] text-grey-300">—</span>
                        )}
                      </td>

                      <td className="px-4 pt-3 pb-1 align-top">
                        <a
                          href={`/admin/cases/${c.id}`}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-grey-50 text-grey-600 border border-grey-200 hover:bg-grey-100 transition-all"
                        >
                          View
                        </a>
                      </td>
                    </tr>

                    {/* Stage history row */}
                    <tr className="border-b border-grey-100">
                      <td colSpan={8} className="px-4 pb-3 pt-0">
                        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                          {timeline.map((entry, i) => (
                            <span key={i} className="inline-flex items-center gap-1">
                              {i > 0 && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 text-grey-300 flex-shrink-0">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              )}
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  entry.isCurrent
                                    ? 'bg-blue/10 text-blue border border-blue/20'
                                    : 'bg-grey-100 text-grey-500'
                                }`}
                              >
                                {entry.label}
                                <span className={`ml-1 font-mono ${entry.isCurrent ? 'text-blue' : 'text-grey-400'}`}>
                                  {entry.days === 0 ? '<1wd' : `${entry.days}wd`}
                                </span>
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                )
              })}

              {(workshopCases ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-grey-400">
                    No cases currently in workshop.
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
