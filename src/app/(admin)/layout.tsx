import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/dashboard')

  // Use service client for profile — better-auth sessions have no Supabase JWT,
  // so the RLS-scoped anon client would return null for all user queries.
  const profileClient = createServiceClient()

  // Look up by email — better-auth uses its own 'user' table with string IDs;
  // our 'users' table uses UUIDs. Email is the only shared key.
  const { data: userProfile } = await profileClient
    .from('users')
    .select('full_name, role, office')
    .eq('email', session.user.email)
    .single()

  const allowedRoles = ['staff_uk', 'staff_us', 'admin']
  const role = (userProfile as { role: string } | null)?.role ?? ''
  if (!allowedRoles.includes(role)) redirect('/')

  const userName = (userProfile as { full_name: string | null } | null)?.full_name ?? session.user.name ?? session.user.email
  const userOffice = (userProfile as { office: string | null } | null)?.office

  // Stats for sidebar badges — use service client so counts are always authoritative regardless of RLS
  const serviceClient = createServiceClient()
  const caseQuery = serviceClient.from('cases').select('id, status, is_on_hold, hold_reason, office')
  const officeFilter = role === 'admin' ? caseQuery : caseQuery.eq('office', (userOffice ?? 'UK') as 'UK' | 'US')

  const { data: allCases } = await officeFilter.not('status', 'in', '("CLOSED","REJECTED")')

  const openCasesCount = allCases?.length ?? 0
  const actionRequiredCount = allCases?.filter(
    (c) => c.is_on_hold && c.hold_reason === 'AWAITING_CUSTOMER'
  ).length ?? 0

  // Check last import staleness (placeholder — will wire up with import_logs table in Phase 9)
  const importStaleDays: number | null = null

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <AdminSidebar
        userName={userName}
        userRole={role}
        openCasesCount={openCasesCount}
        actionRequiredCount={actionRequiredCount}
        importStaleDays={importStaleDays}
      />
      <div className="flex-1 overflow-y-auto bg-grey-50">
        {children}
      </div>
    </div>
  )
}
