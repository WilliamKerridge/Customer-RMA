import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import ProductsTable from '@/components/admin/ProductsTable'
import type { ProductRow } from '@/types/database'
import { Plus, Upload } from 'lucide-react'

const CATEGORIES = [
  'Engine Management',
  'Engine Management Systems',
  'Displays',
  'Loggers',
  'Power Systems',
  'Steering Wheels',
  'Looms',
  'Wind Tunnel',
  'Defence',
]

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string; active?: string }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/products')

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role
  if (!role || !['staff_uk', 'staff_us', 'admin'].includes(role)) {
    redirect('/login')
  }

  const { search = '', category = '', active = '' } = await searchParams

  let query = supabase
    .from('products')
    .select('*')
    .order('category')
    .order('display_name')

  if (search) query = query.or(`display_name.ilike.%${search}%,part_number.ilike.%${search}%`)
  if (category) query = query.eq('category', category)
  if (active === 'true') query = query.eq('active', true)
  else if (active === 'false') query = query.eq('active', false)

  const { data: products } = await query
  const productList = (products ?? []) as ProductRow[]

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-['Space_Grotesk'] text-[22px] font-bold text-text mb-1">
            Products &amp; Fees
          </h1>
          <p className="text-[13px] text-grey-500">
            Approved returnable products and their service fees. Active products appear in the customer submission form. Click any fee to edit inline.
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 ml-6">
          <button
            disabled
            title="CSV import coming in a future phase"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-grey-300 text-grey-400 cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
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
            placeholder="Search by part number or name…"
            className="pl-9 pr-4 py-2 border border-grey-200 rounded-lg text-sm text-text bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-72"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          className="px-3 py-2 border border-grey-200 rounded-lg text-sm text-text bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
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
        {(search || category || active) && (
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm text-grey-500 hover:text-text transition-colors duration-150"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <ProductsTable initialProducts={productList} />
    </div>
  )
}
