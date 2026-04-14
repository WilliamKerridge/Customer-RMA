import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import ProductForm from '@/components/admin/ProductForm'
import type { ProductRow } from '@/types/database'
import { ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ productId: string }>
}

export default async function EditProductPage({ params }: PageProps) {
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

  const { productId } = await params

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) notFound()

  // Fetch open case count to conditionally disable delete
  const { count: openCases } = await supabase
    .from('case_products')
    .select('cases!inner(id)', { count: 'exact', head: true })
    .eq('product_id', productId)
    .not('cases.status', 'in', '("CLOSED","REJECTED")')

  const { count: totalCases } = await supabase
    .from('case_products')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  return (
    <div className="px-8 py-7">
      <div className="flex items-center gap-2 text-[12px] text-grey-400 font-mono mb-5">
        <Link href="/admin/products" className="hover:text-text transition-colors">Products &amp; Fees</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-grey-600">Edit Product</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="font-['Space_Grotesk'] text-[22px] font-bold text-text">Edit Product</h1>
          <p className="text-[12px] text-grey-500 mt-0.5 font-mono">
            {(product as ProductRow).part_number} — {(product as ProductRow).display_name}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          (product as ProductRow).active
            ? 'bg-green-50 text-green-700'
            : 'bg-grey-100 text-grey-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${(product as ProductRow).active ? 'bg-green-500' : 'bg-grey-400'}`} />
          {(product as ProductRow).active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <ProductForm
        product={product as ProductRow}
        totalCases={totalCases ?? 0}
        openCases={openCases ?? 0}
        isAdmin={role === 'admin'}
      />
    </div>
  )
}
