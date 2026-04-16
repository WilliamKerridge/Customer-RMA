import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import RMASubmitForm from '@/components/forms/RMASubmitForm'
import type { CustomerAccountRow } from '@/types/database'

export default async function SubmitPage() {
  const supabase = await createClient()

  // Fetch active products for the form
  const { data: products } = await supabase
    .from('products')
    .select('id, part_number, variant, display_name, category, test_fee, standard_repair_fee, major_repair_fee, service_fee')
    .eq('active', true)
    .order('category')
    .order('display_name')

  // Get current user (optional — /submit is public)
  const session = await auth.api.getSession({ headers: await headers() })

  // If authenticated, fetch the customer account for PO/credit terms
  let account: CustomerAccountRow | null = null
  if (session?.user) {
    const { data } = await supabase
      .from('customer_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    account = data
  }

  const initialUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        company: (session.user as { company?: string }).company ?? null,
        phone: (session.user as { phone?: string }).phone ?? null,
      }
    : null

  return (
    <>
      {/* Page hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }}
        />
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono">
            Home
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-brand-accent">New Return</span>
          </div>
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">
            New Return Request
          </h1>
          <p className="mt-1.5 text-[13px] text-white/60">
            Submit a product for repair, service, or return. You'll receive a Case ID immediately.
          </p>
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-[1200px] mx-auto w-full px-8 py-7">
        <RMASubmitForm
          products={products ?? []}
          initialUser={initialUser}
          account={account}
        />
      </div>
    </>
  )
}
