'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, UserPlus } from 'lucide-react'

interface FormState {
  full_name: string
  email: string
  company: string
  phone: string
  company_name: string
  credit_terms: boolean
  po_required: boolean
  notes: string
  // Billing address fields
  billing_street: string
  billing_city: string
  billing_postcode: string
  billing_country: string
}

interface FieldError {
  full_name?: string
  email?: string
  company?: string
  [key: string]: string | undefined
}

export default function AddAccountForm() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    company_name: '',
    credit_terms: false,
    po_required: false,
    notes: '',
    billing_street: '',
    billing_city: '',
    billing_postcode: '',
    billing_country: 'United Kingdom',
  })

  const [errors, setErrors] = useState<FieldError>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const e: FieldError = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    setServerError('')

    const billingAddress = (
      form.billing_street || form.billing_city || form.billing_postcode || form.billing_country
    ) ? {
      street: form.billing_street || null,
      city: form.billing_city || null,
      postcode: form.billing_postcode || null,
      country: form.billing_country || null,
    } : null

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || form.company.trim() || null,
      credit_terms: form.credit_terms,
      po_required: form.po_required,
      account_active: true,
      notes: form.notes.trim() || null,
      billing_address: billingAddress,
    }

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.status === 409 && json.accountId) {
        // Account already exists — redirect to it
        router.push(`/admin/accounts/${json.accountId}`)
        return
      }

      if (!res.ok) {
        setServerError(json.message ?? 'Failed to create account')
        setSaving(false)
        return
      }

      router.push(`/admin/accounts/${json.account.id}`)
      router.refresh()
    } catch {
      setServerError('Network error — please try again')
      setSaving(false)
    }
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

  function inputClass(error?: string) {
    return `w-full px-3.5 py-2.5 border-2 rounded-lg text-sm text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${
      error ? 'border-red-400 ring-2 ring-red-400/10' : 'border-grey-200'
    }`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      {/* LEFT COLUMN */}
      <div className="space-y-5">
        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Contact Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-grey-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  className={inputClass(errors.full_name)}
                />
                {errors.full_name && <p className="mt-1 text-[12px] text-red-500">{errors.full_name}</p>}
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-grey-700 mb-1.5">Company</label>
                <input
                  id="company"
                  value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-grey-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputClass(errors.email)}
                />
                {errors.email && <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>}
                <p className="mt-1 text-[11px] text-grey-400">Used to look up or create the customer login</p>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-grey-700 mb-1.5">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-1.5">Internal Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Any internal notes about this customer account…"
                className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Billing Settings</h2>
          </div>
          <div className="p-6 space-y-5">
            <ToggleSwitch
              checked={form.credit_terms}
              onToggle={() => set('credit_terms', !form.credit_terms)}
              label="Credit Terms"
              description="Account has approved credit terms. Payment is collected by invoice."
            />
            <div className="border-t border-grey-100 pt-5">
              <ToggleSwitch
                checked={form.po_required}
                onToggle={() => set('po_required', !form.po_required)}
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
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-5">
        {/* Billing Address */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Billing Address</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="billing_street" className="block text-sm font-medium text-grey-700 mb-1.5">Street</label>
              <input
                id="billing_street"
                value={form.billing_street}
                onChange={(e) => set('billing_street', e.target.value)}
                placeholder="123 Circuit Road"
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="billing_city" className="block text-sm font-medium text-grey-700 mb-1.5">City</label>
              <input
                id="billing_city"
                value={form.billing_city}
                onChange={(e) => set('billing_city', e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="billing_postcode" className="block text-sm font-medium text-grey-700 mb-1.5">Postcode / ZIP</label>
              <input
                id="billing_postcode"
                value={form.billing_postcode}
                onChange={(e) => set('billing_postcode', e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="billing_country" className="block text-sm font-medium text-grey-700 mb-1.5">Country</label>
              <input
                id="billing_country"
                value={form.billing_country}
                onChange={(e) => set('billing_country', e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">What happens next?</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-start gap-2.5">
              <UserPlus className="w-4 h-4 text-grey-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-grey-500">
                If a user with this email already exists they will be linked to this account. Otherwise a new customer record is created.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-grey-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-grey-500">
                The customer can set their own password by using the forgot password link on the login page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — full width */}
      <div className="lg:col-span-2 flex items-center justify-between pt-2">
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.push('/admin/accounts')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-grey-300 text-grey-700 hover:bg-grey-50 transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
