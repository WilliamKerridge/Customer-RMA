import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const patchSchema = z.object({
  part_number: z.string().min(1).optional(),
  variant: z.string().nullable().optional(),
  display_name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  active: z.boolean().optional(),
  test_fee: z.number().min(0).optional(),
  standard_repair_fee: z.number().min(0).optional(),
  major_repair_fee: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
})

async function requireStaff() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null

  return { ...session.user, canonicalId: profile.id, role: profile.role }
}

// GET — single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { productId } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('products')
      .select('*, case_products(id)')
      .eq('id', productId)
      .single()

    if (error || !data) return NextResponse.json({ message: 'Product not found' }, { status: 404 })

    const openCases = await supabase
      .from('case_products')
      .select('cases!inner(id, status)', { count: 'exact' })
      .eq('product_id', productId)
      .not('cases.status', 'in', '("CLOSED","REJECTED")')

    return NextResponse.json({
      product: data,
      totalCases: (data.case_products as unknown[]).length,
      openCases: openCases.count ?? 0,
    })
  } catch (err) {
    console.error('Product GET error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update product (staff and admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { productId } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'A product with that part number already exists' }, { status: 409 })
      }
      console.error('Product PATCH failed:', error)
      return NextResponse.json({ message: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (err) {
    console.error('Product PATCH error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — admin only, blocked if open cases exist
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin only' }, { status: 403 })

    const { productId } = await params
    const supabase = createServiceClient()

    // Block delete if open cases reference this product
    const { count } = await supabase
      .from('case_products')
      .select('cases!inner(id)', { count: 'exact', head: true })
      .eq('product_id', productId)
      .not('cases.status', 'in', '("CLOSED","REJECTED")')

    if (count && count > 0) {
      return NextResponse.json(
        { message: 'Cannot delete a product with open cases' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      console.error('Product DELETE failed:', error)
      return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Product DELETE error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
