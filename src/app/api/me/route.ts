import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    // 401 — session not ready. Login page uses this to retry until the cookie propagates.
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  // better-auth uses its own 'user' table with string IDs.
  // Our 'users' table (with roles) uses UUIDs. The bridge is email.
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role, full_name, office')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string; full_name: string | null; office: string | null } | null
  const role = profile?.role ?? 'customer'
  return NextResponse.json({ role, userId: profile?.id ?? null }, { status: 200 })
}
