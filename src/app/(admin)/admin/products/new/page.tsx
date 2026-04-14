import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import ProductForm from '@/components/admin/ProductForm'
import { ChevronRight } from 'lucide-react'

export default async function NewProductPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/admin/products/new')

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role
  if (!role || !['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/login')

  const isAdmin = role === 'admin'

  return (
    <div className="px-8 py-7">
      <div className="flex items-center gap-2 text-[12px] text-grey-400 font-mono mb-5">
        <Link href="/admin/products" className="hover:text-text transition-colors">Products &amp; Fees</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-grey-600">New Product</span>
      </div>

      <div className="mb-6">
        <h1 className="font-['Space_Grotesk'] text-[22px] font-bold text-text">Add Product</h1>
        <p className="text-[13px] text-grey-500 mt-1">Create a new returnable product and set its service fees.</p>
      </div>

      <ProductForm isAdmin={isAdmin} />
    </div>
  )
}
