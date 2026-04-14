import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import ImportPageTabs from '@/components/admin/ImportPageTabs'

export default async function AdminImportPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const supabase = createServiceClient()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  if (!['staff_uk', 'staff_us', 'admin'].includes((userProfile as { role: string } | null)?.role ?? '')) {
    redirect('/admin/dashboard')
  }

  const { data: logs } = await supabase
    .from('import_logs')
    .select('id, filename, uploaded_at, total_rows, matched_rows, updated_rows')
    .order('uploaded_at', { ascending: false })
    .limit(40)

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }} />
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">Data Import</h1>
          <p className="mt-1.5 text-[13px] text-white/60">
            Import workshop data from Power BI, or bulk-upload customer accounts from Excel
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <ImportPageTabs logs={logs ?? []} />
      </div>
    </>
  )
}
