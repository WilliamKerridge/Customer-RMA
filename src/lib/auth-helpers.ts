import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export type StaffRole = 'staff_uk' | 'staff_us' | 'admin'

export interface StaffContext {
  /** Better Auth session user id (TEXT) — do NOT use as a customer_id/UUID. */
  sessionUserId: string
  email: string
  name: string | null
  /** Canonical public.users UUID — use for author_id / uploaded_by columns. */
  canonicalId: string
  role: StaffRole
  /** Office the staff member belongs to. NULL for admin (global access). */
  office: 'UK' | 'US' | null
}

const STAFF_ROLES: StaffRole[] = ['staff_uk', 'staff_us', 'admin']

/**
 * Resolve the current session and confirm the user is staff/admin.
 * Returns the canonical profile (UUID + role + office) or null if the
 * caller is unauthenticated or not staff.
 *
 * Use this in every admin/staff API route — the middleware is a no-op,
 * so each route must enforce its own authZ.
 */
export async function requireStaff(): Promise<StaffContext | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role, office')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string; office: 'UK' | 'US' | null } | null
  if (!profile || !STAFF_ROLES.includes(profile.role as StaffRole)) return null

  return {
    sessionUserId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    canonicalId: profile.id,
    role: profile.role as StaffRole,
    office: profile.office,
  }
}

/** Resolve the current session and confirm the user is an admin. */
export async function requireAdmin(): Promise<StaffContext | null> {
  const staff = await requireStaff()
  if (!staff || staff.role !== 'admin') return null
  return staff
}

/**
 * Office segregation: staff_uk may only act on UK cases, staff_us on US
 * cases. Admins are global. Office routing per CLAUDE.md — a staff member
 * must not manage another office's queue.
 */
export function canAccessOffice(staff: StaffContext, office: 'UK' | 'US'): boolean {
  if (staff.role === 'admin') return true
  if (staff.role === 'staff_uk') return office === 'UK'
  if (staff.role === 'staff_us') return office === 'US'
  return false
}
