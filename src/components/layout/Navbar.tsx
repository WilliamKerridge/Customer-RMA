'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  staff_uk: 'Staff — UK',
  staff_us: 'Staff — US',
  admin: 'Admin',
}

export function Navbar() {
  const router = useRouter()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role ?? 'customer'
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-navy transition-shadow duration-200 ${
        scrolled ? 'shadow-lg shadow-black/20' : 'shadow-sm shadow-black/10'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-blue rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-blue-light transition-colors duration-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="14" height="3" rx="1" fill="white" />
              <rect x="2" y="7.5" width="14" height="3" rx="1" fill="white" opacity="0.8" />
              <rect x="2" y="13" width="14" height="3" rx="1" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="font-heading font-bold text-sm tracking-widest text-white uppercase">
            Cosworth <span className="text-brand-accent">Returns</span>
          </span>
        </Link>

        {/* Right: auth controls */}
        <nav className="flex items-center gap-4" aria-label="Primary navigation">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-white/10 transition-colors"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar name={user.name ?? user.email} />
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-white text-sm font-medium">
                    {user.name ?? user.email}
                  </span>
                  <span className="text-slate-400 text-xs">{roleLabel}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-grey-200 py-1 z-50">
                  {(role === 'staff_uk' || role === 'staff_us' || role === 'admin') ? (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-grey-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/cases"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-grey-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      My Cases
                    </Link>
                  )}
                  <div className="border-t border-grey-200 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-grey-50 transition-colors text-left"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue hover:bg-blue-light text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
