'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserInfo {
  id: string
  full_name: string | null
  email: string | null
  company: string | null
  phone: string | null
}

export interface AccountRow {
  id: string
  user_id: string | null
  company_name: string | null
  credit_terms: boolean
  po_required: boolean
  account_active: boolean
  notes: string | null
  created_at: string
  users: UserInfo | null
  totalCases: number
  openCases: number
}

interface AccountsTableProps {
  initialAccounts: AccountRow[]
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const AVATAR_COLOURS = [
  '#0066cc', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2',
]

function avatarColour(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLOURS.length
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

export default function AccountsTable({ initialAccounts }: AccountsTableProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<AccountRow[]>(initialAccounts)
  const [, startTransition] = useTransition()

  async function toggleActive(account: AccountRow) {
    const next = !account.account_active
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, account_active: next } : a))
    )

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_active: next }),
      })
      if (!res.ok) throw new Error('Failed')
      startTransition(() => router.refresh())
    } catch {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, account_active: account.account_active } : a))
      )
    }
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-grey-50 border-b border-grey-200">
            <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Contact</th>
            <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Company</th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Credit Terms</th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">PO Required</th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Total Cases</th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Open</th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Active</th>
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-sm text-grey-400 py-12">No accounts found.</td>
            </tr>
          )}
          {accounts.map((account) => {
            const user = account.users
            const displayName = user?.full_name ?? user?.email ?? 'Unknown'
            const company = account.company_name ?? user?.company ?? '—'

            return (
              <tr
                key={account.id}
                className={`border-b border-grey-100 last:border-0 transition-colors duration-150 ${
                  !account.account_active ? 'opacity-50' : ''
                }`}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                      style={{ background: avatarColour(account.id) }}
                    >
                      {initials(user?.full_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-[13.5px] text-text">{displayName}</div>
                      {user?.email && (
                        <div className="text-[11px] text-grey-400">{user.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[13.5px] text-grey-700">{company}</td>
                <td className="px-4 py-3.5 text-center">
                  {account.credit_terms ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-[12px] text-grey-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {account.po_required ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      Required
                    </span>
                  ) : (
                    <span className="text-[12px] text-grey-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center font-mono text-[13px] text-grey-700">
                  {account.totalCases}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {account.openCases > 0 ? (
                    <span className="font-mono text-[13px] text-blue-600 font-semibold">{account.openCases}</span>
                  ) : (
                    <span className="font-mono text-[13px] text-grey-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => toggleActive(account)}
                    aria-label={account.account_active ? 'Deactivate account' : 'Activate account'}
                    className="relative inline-flex h-[22px] w-[38px] cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                    style={{ background: account.account_active ? '#0066cc' : '#cbd5e1' }}
                  >
                    <span
                      className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
                      style={{ left: account.account_active ? 18 : 2 }}
                    />
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/admin/accounts/${account.id}`}
                    className="inline-flex items-center text-xs font-medium text-grey-600 hover:text-text px-2.5 py-1.5 rounded-lg border border-grey-200 hover:bg-grey-50 transition-all duration-150"
                  >
                    View
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
