import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createUserScopedClient } from '@/lib/supabase/with-auth'
import CaseListClient from './CaseListClient'

export default async function CasesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/cases')

  // Resolves canonical UUID from public.users by email (better-auth IDs differ).
  // Returns the service client + UUID for use in customer_id filters.
  const { supabase, userId } = await createUserScopedClient(session.user.email)

  // Fetch all cases for this customer with their first product name
  const { data: cases } = await supabase
    .from('cases')
    .select(`
      *,
      case_products (
        product_id,
        products ( display_name, variant )
      )
    `)
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })

  // Flatten: attach first product name to each case
  type RawCase = typeof cases extends (infer T)[] | null ? T : never
  const enriched = (cases ?? []).map((c: RawCase) => {
    const cp = (c as { case_products?: { products?: { display_name: string; variant: string | null } | null }[] }).case_products?.[0]
    const product_name = cp?.products
      ? `${cp.products.display_name}${cp.products.variant ? ` ${cp.products.variant}` : ''}`
      : null
    const clientCase = { ...c, product_name } as typeof c & { product_name: string | null }
    // SAP financial data is staff-only — strip before passing to client component (CLAUDE.md rule 5)
    delete (clientCase as Record<string, unknown>).sap_order_value
    delete (clientCase as Record<string, unknown>).sap_spent_hours
    return clientCase
  })

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div
          className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }}
        />
        <div className="max-w-[1200px] mx-auto flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono">
              Home
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-brand-accent">My Returns</span>
            </div>
            <h1 className="font-heading text-[26px] font-bold text-white leading-tight">My Returns</h1>
            <p className="mt-1.5 text-[13px] text-white/60">
              Track your cases and manage your returns with Cosworth Electronics.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Return
          </Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-8 py-7">
        <CaseListClient cases={enriched} />
      </div>
    </>
  )
}
