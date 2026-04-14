import { NextResponse, type NextRequest } from 'next/server'

/**
 * This app uses better-auth for authentication (not Supabase Auth).
 * better-auth sessions require a Node.js database connection (pg) which is
 * not available in the Edge runtime that Next.js middleware runs in.
 *
 * Route protection is therefore handled entirely at the layout/page level using
 * auth.api.getSession() — which runs in the Node.js Server Component runtime.
 *
 * Protected routes:
 *  /admin/*   — requires staff_uk | staff_us | admin  (enforced in (admin)/layout.tsx)
 *  /cases/*   — requires any authenticated user       (enforced in (customer)/layout.tsx)
 *  /cases/[caseId]/respond — public, token-based
 *  /submit    — public
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
