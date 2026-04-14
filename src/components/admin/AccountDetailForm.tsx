'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'

interface AccountData {
  id: string
  user_id: string | null
  company_name: string | null
  billing_address: Record<string, unknown> | null
  credit_terms: boolean
  po_required: boolean
  account_active: boolean
  notes: string | null
  created_at: string
}

interface UserData {
  id: string
  full_name: string | null
  email: string | null
  company: string | null
  phone: string | null
  role: string | null
  created_at: string | null
}

interface CaseRow {
  id: string
  case_number: string
  status: string
  fault_type: string
  created_at: string
  case_products: { products: { display_name: string } | null }[]
}

interface AccountDetailFormProps {
  account: AccountData
  user: UserData | null
  cases: CaseRow[]
  totalCases: number
  openCases: number
  lastCaseDate: string | null
  statusLabels: Record<string, string>
  isAdmin: boolean
}

const STATUS_PILL: Record<string, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800',
  AWAITING_PAYMENT: 'bg-orange-50 text-orange-800',
  RMA_ISSUED: 'bg-purple-50 text-purple-700',
  PARTS_RECEIVED: 'bg-cyan-50 text-cyan-800',
  IN_REPAIR: 'bg-blue-50 text-blue-800',
  QUALITY_CHECK: 'bg-indigo-50 text-indigo-800',
  READY_TO_RETURN: 'bg-teal-50 text-teal-800',
  CLOSED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AccountDetailForm({
  account,
  user,
  cases,
  totalCases,
  openCases,
  lastCaseDate,
  statusLabels,
  isAdmin,
}: AccountDetailFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    company: user?.company ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    company_name: account.company_name ?? '',
    notes: account.notes ?? '',
    credit_terms: account.credit_terms,
    po_required: account.po_required,
    account_active: account.account_active,
  })
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setServerError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name || null,
          phone: form.phone || null,
          company: form.company || null,
          company_name: form.company_name || null,
          notes: form.notes || null,
          credit_terms: form.credit_terms,
          po_required: form.po_required,
          account_active: form.account_active,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.message ?? 'Failed to save')
        setSaving(false)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch {
      setServerError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  function toggle(field: 'credit_terms' | 'po_required' | 'account_active') {
    setForm((f) => ({ ...f, [field]: !f[field] }))
  }

  function ToggleSwitch({ checked, onToggle, label, description }: {
    checked: boolean
    onToggle: () => void
    label: string
    description: string
  }) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-text">{label}</div>
          <div className="text-[12px] text-grey-400 mt-0.5">{description}</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Toggle ${label}`}
          className="relative inline-flex h-[26px] w-[46px] cursor-pointer rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5 focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ background: checked ? '#0066cc' : '#cbd5e1' }}
        >
          <span
            className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all duration-200"
            style={{ left: checked ? 22 : 3 }}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      {/* LEFT COLUMN */}
      <div className="space-y-5">
        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Account Settings</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-0">
              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-grey-700 mb-1.5">Full Name</label>
                <input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="company" className="block text-sm font-medium text-grey-700 mb-1.5">Company</label>
                <input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-grey-700 mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-3.5 py-2.5 border-2 border-grey-100 rounded-lg text-sm text-grey-400 bg-grey-50 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-grey-400">Email cannot be changed here</p>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-grey-700 mb-1.5">Phone</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
                />
              </div>
            </div>
            <div className="mb-0">
              <label htmlFor="internal_notes" className="block text-sm font-medium text-grey-700 mb-1.5">Internal Notes</label>
              <textarea
                id="internal_notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes about this customer account…"
                className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Credit Terms */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Billing Settings</h2>
          </div>
          <div className="p-6 space-y-5">
            <ToggleSwitch
              checked={form.credit_terms}
              onToggle={() => toggle('credit_terms')}
              label="Credit Terms"
              description="Account has approved credit terms. Payment is collected by invoice."
            />
            <div className="border-t border-grey-100 pt-5">
              <ToggleSwitch
                checked={form.po_required}
                onToggle={() => toggle('po_required')}
                label="PO Number Required"
                description="Customer must provide a purchase order number when submitting a return."
              />
            </div>
            {form.credit_terms && (
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-700">
                  Credit terms enabled. This customer will not be prompted to pay online — payment will be handled by invoice.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cases table */}
        {cases.length > 0 && (
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-grey-100 flex items-center justify-between">
              <h2 className="font-semibold text-[15px] text-text">Recent Cases</h2>
              <span className="text-[12px] text-grey-400">Showing {cases.length} of {totalCases}</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-grey-50 border-b border-grey-200">
                  <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Case ID</th>
                  <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const productName = c.case_products[0]?.products?.display_name ?? '—'
                  const statusLabel = statusLabels[c.status] ?? c.status
                  const pillClass = STATUS_PILL[c.status] ?? 'bg-grey-100 text-grey-600'
                  return (
                    <tr key={c.id} className="border-b border-grey-100 last:border-0 hover:bg-grey-50 transition-colors duration-150">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          className="font-mono text-[12px] text-blue-600 hover:text-blue-700"
                        >
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-grey-700">{productName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${pillClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-grey-500">{formatDate(c.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {totalCases > 10 && (
              <div className="px-4 py-3 border-t border-grey-100">
                <span className="text-[12px] text-grey-400">
                  Showing 10 of {totalCases} cases — view all from the Cases page
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-5">
        {/* Account Summary */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Account Summary</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Total Cases</span>
              <span className="font-mono font-medium text-text">{totalCases}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Open Cases</span>
              <span className={`font-mono font-medium ${openCases > 0 ? 'text-blue-600' : 'text-text'}`}>
                {openCases}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Credit Terms</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                form.credit_terms ? 'bg-green-50 text-green-700' : 'bg-grey-100 text-grey-500'
              }`}>
                {form.credit_terms ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">PO Required</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                form.po_required ? 'bg-blue-50 text-blue-700' : 'bg-grey-100 text-grey-500'
              }`}>
                {form.po_required ? 'Required' : 'No'}
              </span>
            </div>
            <div className="border-t border-grey-100 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Account Since</span>
                <span className="text-text font-medium">{formatDate(account.created_at)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Last Case</span>
              <span className="text-text font-medium">{formatDate(lastCaseDate)}</span>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100 flex items-center justify-between">
            <h2 className="font-semibold text-[15px] text-text">Billing Address</h2>
          </div>
          <div className="p-6">
            {account.billing_address ? (
              <pre className="text-[12px] text-grey-600 whitespace-pre-wrap font-sans">
                {Object.values(account.billing_address).filter(Boolean).join('\n')}
              </pre>
            ) : (
              <p className="text-[13px] text-grey-400">No billing address on file.</p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100">
              <h2 className="font-semibold text-[15px] text-red-600">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-grey-500 mb-4">
                Deactivate this account. The customer will no longer be able to submit new cases.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, account_active: !f.account_active }))
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 cursor-pointer"
                style={form.account_active
                  ? { borderColor: '#fca5a5', color: '#dc2626' }
                  : { borderColor: '#d1fae5', color: '#059669' }
                }
              >
                {form.account_active ? 'Deactivate Account' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer — full width */}
      <div className="lg:col-span-2 flex items-center justify-between pt-2">
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && <p className="text-sm text-green-600">Saved successfully</p>}
        <div className="flex gap-3 ml-auto">
          <Link
            href="/admin/accounts"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-grey-300 text-grey-700 hover:bg-grey-50 transition-all duration-150"
          >
            Back to Accounts
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
