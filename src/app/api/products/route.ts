import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const createSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  variant: z.string().optional().nullable(),
  display_name: z.string().min(1, 'Display name is required'),
  category: z.string().min(1, 'Category is required'),
  active: z.boolean().default(true),
  test_fee: z.number().min(0).default(0),
  standard_repair_fee: z.number().min(0).default(0),
  major_repair_fee: z.number().min(0).default(0),
  service_fee: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  tariff_code: z.string().optional().nullable(),
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

// GET — list products with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const category = searchParams.get('category') ?? ''
    const activeFilter = searchParams.get('active') ?? ''

    const supabase = createServiceClient()
    let query = supabase
      .from('products')
      .select('*')
      .order('category')
      .order('display_name')

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,part_number.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (activeFilter === 'true') {
      query = query.eq('active', true)
    } else if (activeFilter === 'false') {
      query = query.eq('active', false)
    }

    const { data, error } = await query
    if (error) {
      console.error('Products GET failed:', error)
      return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products: data })
  } catch (err) {
    console.error('Products GET error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST — create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin only' }, { status: 403 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'A product with that part number already exists' }, { status: 409 })
      }
      console.error('Product create failed:', error)
      return NextResponse.json({ message: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (err) {
    console.error('Products POST error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
