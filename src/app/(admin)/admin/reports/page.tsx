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
  days: number
  isCurrent: boolean
}

function buildCaseTimeline(
  caseCreatedAt: string,
  currentStatus: string,
  currentWorkshopStage: string | null,
  updates: Array<{ status_change_to: string | null; content: string; created_at: string }>
): TimelineEntry[] {
  // Include status transitions AND case-level workshop stage transitions
  const transitions = updates
    .filter(u => u.status_change_to !== null || u.content.startsWith('Workshop stage updated to'))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const entries: TimelineEntry[] = []
  let prevLabel = 'Submitted'
  let prevTime = new Date(caseCreatedAt)

  for (const u of transitions) {
    const exitTime = new Date(u.created_at)
    const days = Math.round((exitTime.getTime() - prevTime.getTime()) / 86_400_000)
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
  const daysAtCurrent = Math.round((Date.now() - prevTime.getTime()) / 86_400_000)
  entries.push({ label: currentLabel, days: daysAtCurrent, isCurrent: true })

  return entries
}

function daysColour(days: number): string {
  if (days > 5) return 'text-red-600 font-semibold'
  if (days > 2) return 'text-amber-700'
  return 'text-grey-600'
}

function totalAgeColour(days: number): string {
  if (days > 28) return 'text-red-600 font-semibold'
  if (days > 14) return 'text-amber-700'
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

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="font-heading text-[22px] font-bold text-text">Reports</h1>
        <p className="text-[13px] text-grey-500 mt-0.5">
          {role === 'admin' ? 'All offices' : `${office} workshop queue`}
        </p>
      </div>
      <p className="text-[13px] text-grey-400">Loading report data…</p>
    </div>
  )
}
