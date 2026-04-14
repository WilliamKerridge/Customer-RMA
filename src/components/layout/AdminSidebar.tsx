'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  userName: string
  userRole: string
  openCasesCount: number
  actionRequiredCount: number
  importStaleDays: number | null
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  staff_uk: 'Staff — UK',
  staff_us: 'Staff — US',
  admin: 'Admin',
}

export default function AdminSidebar({
  userName,
  userRole,
  openCasesCount,
  actionRequiredCount,
  importStaleDays,
}: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin'
    return pathname.startsWith(href)
  }

  function NavLink({
    href,
    icon,
    label,
    badge,
    badgeVariant = 'blue',
  }: {
    href: string
    icon: React.ReactNode
    label: string
    badge?: number | string
    badgeVariant?: 'blue' | 'amber' | 'orange'
  }) {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
          active
            ? 'bg-blue/8 text-blue border-l-[3px] border-blue -ml-px pl-[11px]'
            : 'text-grey-600 hover:bg-grey-50 hover:text-text'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-blue' : 'text-grey-400 group-hover:text-grey-500'}`}>
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge !== 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              badgeVariant === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : badgeVariant === 'orange'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue/10 text-blue'
            }`}
          >
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="w-[232px] flex-shrink-0 bg-white border-r border-grey-200 flex flex-col h-full">
      {/* User info */}
      <div className="px-4 py-5 border-b border-grey-100">
        <div className="flex items-center gap-3">
          <Avatar name={userName} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-text truncate">{userName}</div>
            <div className="text-[11px] text-grey-400 mt-0.5">
              {ROLE_LABELS[userRole] ?? userRole}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {/* Overview */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold text-grey-400 uppercase tracking-[0.08em]">
            Overview
          </div>
          <div className="space-y-0.5">
            <NavLink
              href="/admin/dashboard"
              badge={actionRequiredCount}
              badgeVariant="orange"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              }
              label="Dashboard"
            />
            <NavLink
              href="/admin/cases"
              badge={openCasesCount}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
              }
              label="All Cases"
            />
          </div>
        </div>

        {/* Admin */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold text-grey-400 uppercase tracking-[0.08em]">
            Admin
          </div>
          <div className="space-y-0.5">
            <NavLink
              href="/admin/products"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              }
              label="Products & Fees"
            />
            <NavLink
              href="/admin/accounts"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              label="Accounts"
            />
            <NavLink
              href="/admin/import"
              badge={importStaleDays !== null && importStaleDays > 3 ? '!' : undefined}
              badgeVariant="amber"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              }
              label="Import Power BI"
            />
          </div>
        </div>
      </nav>

      {/* Footer link */}
      <div className="px-4 py-3 border-t border-grey-100">
        <Link
          href="/cases"
          className="flex items-center gap-2 text-[12px] text-grey-400 hover:text-grey-600 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Customer view
        </Link>
      </div>
    </aside>
  )
}
