'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductRow } from '@/types/database'
import { Info } from 'lucide-react'

const CATEGORIES = [
  'Engine Management',
  'Engine Management Systems',
  'Displays',
  'Loggers',
  'Power Systems',
  'Steering Wheels',
  'Looms',
  'Wind Tunnel',
  'Defence',
]

interface ProductFormProps {
  product?: ProductRow
  totalCases?: number
  openCases?: number
  isAdmin: boolean
}

interface FormState {
  part_number: string
  variant: string
  display_name: string
  category: string
  notes: string
  test_fee: string
  standard_repair_fee: string
  major_repair_fee: string
  active: boolean
}

export default function ProductForm({ product, totalCases = 0, openCases = 0, isAdmin }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product

  const [form, setForm] = useState<FormState>({
    part_number: product?.part_number ?? '',
    variant: product?.variant ?? '',
    display_name: product?.display_name ?? '',
    category: product?.category ?? '',
    notes: product?.notes ?? '',
    test_fee: String(product?.test_fee ?? 0),
    standard_repair_fee: String(product?.standard_repair_fee ?? 0),
    major_repair_fee: String(product?.major_repair_fee ?? 0),
    active: product?.active ?? true,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.part_number.trim()) e.part_number = 'Part number is required'
    if (!form.display_name.trim()) e.display_name = 'Display name is required'
    if (!form.category) e.category = 'Category is required'
    if (isNaN(Number(form.test_fee)) || Number(form.test_fee) < 0) e.test_fee = 'Must be a positive number'
    if (isNaN(Number(form.standard_repair_fee)) || Number(form.standard_repair_fee) < 0) e.standard_repair_fee = 'Must be a positive number'
    if (isNaN(Number(form.major_repair_fee)) || Number(form.major_repair_fee) < 0) e.major_repair_fee = 'Must be a positive number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    setServerError('')

    const payload = {
      part_number: form.part_number.trim(),
      variant: form.variant.trim() || null,
      display_name: form.display_name.trim(),
      category: form.category,
      notes: form.notes.trim() || null,
      test_fee: Number(form.test_fee),
      standard_repair_fee: Number(form.standard_repair_fee),
      major_repair_fee: Number(form.major_repair_fee),
      active: form.active,
    }

    try {
      const url = isEdit ? `/api/products/${product!.id}` : '/api/products'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.message ?? 'Failed to save product')
        setSaving(false)
        return
      }
      router.push('/admin/products')
      router.refresh()
    } catch {
      setServerError('Network error — please try again')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!product || !isAdmin) return
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.message ?? 'Failed to delete product')
        setDeleting(false)
        return
      }
      router.push('/admin/products')
      router.refresh()
    } catch {
      setServerError('Network error — please try again')
      setDeleting(false)
    }
  }

  function field(
    id: keyof FormState,
    label: string,
    required = false,
    hint?: string
  ) {
    return (
      <div className="mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-grey-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={id}
          value={form[id] as string}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          className={`w-full px-3.5 py-2.5 border-2 rounded-lg text-sm text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${
            errors[id] ? 'border-red-400 ring-2 ring-red-400/10' : 'border-grey-200'
          }`}
        />
        {hint && <p className="mt-1 text-[12px] text-grey-400">{hint}</p>}
        {errors[id] && <p className="mt-1 text-[12px] text-red-500">{errors[id]}</p>}
      </div>
    )
  }

  function feeField(id: 'test_fee' | 'standard_repair_fee' | 'major_repair_fee', label: string, hint: string) {
    return (
      <div className="mb-5">
        <label htmlFor={id} className="block text-sm font-medium text-grey-700 mb-1.5">
          {label} (£)
        </label>
        <input
          id={id}
          type="number"
          min="0"
          step="50"
          value={form[id]}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          className={`w-full px-3.5 py-2.5 border-2 rounded-lg text-sm font-mono text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${
            errors[id] ? 'border-red-400 ring-2 ring-red-400/10' : 'border-grey-200'
          }`}
        />
        <p className="mt-1 text-[12px] text-grey-400">{hint}</p>
        {errors[id] && <p className="mt-1 text-[12px] text-red-500">{errors[id]}</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      {/* LEFT COLUMN */}
      <div className="space-y-5">
        {/* Product Details */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Product Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-0">
              <div className="mb-5">
                <label htmlFor="part_number" className="block text-sm font-medium text-grey-700 mb-1.5">
                  Part Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="part_number"
                  value={form.part_number}
                  onChange={(e) => setForm((f) => ({ ...f, part_number: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 border-2 rounded-lg text-sm font-mono text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${
                    errors.part_number ? 'border-red-400' : 'border-grey-200'
                  }`}
                />
                <p className="mt-1 text-[12px] text-grey-400">Must be unique. Matches SAP material number.</p>
                {errors.part_number && <p className="mt-1 text-[12px] text-red-500">{errors.part_number}</p>}
              </div>
              {field('variant', 'Variant', false, 'e.g. BTCC, Porsche, LMP2')}
            </div>
            {field('display_name', 'Display Name', true, 'Shown to customers in the submission form dropdown.')}
            <div className="mb-5">
              <label htmlFor="category" className="block text-sm font-medium text-grey-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={`w-full px-3.5 py-2.5 border-2 rounded-lg text-sm text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 cursor-pointer ${
                  errors.category ? 'border-red-400' : 'border-grey-200'
                }`}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-[12px] text-red-500">{errors.category}</p>}
            </div>
            <div className="mb-0">
              <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-1.5">Internal Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Common faults, repair notes, typical parts…"
                className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-text bg-white outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Service Fees */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100 flex items-center justify-between">
            <h2 className="font-semibold text-[15px] text-text">Service Fees</h2>
            <span className="text-[12px] text-grey-400">Shown to customers as estimates</span>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-blue-700">
                Fees are shown as estimates on the submission form. Final charges are set by the service team on each case.
              </p>
            </div>
            {feeField('test_fee', 'Test Fee', 'Fee charged when unit is received and tested')}
            {feeField('standard_repair_fee', 'Standard Repair Fee', 'Standard component-level repair')}
            {feeField('major_repair_fee', 'Major Repair Fee', 'Board-level or full unit replacement')}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-5">
        {/* Visibility */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-semibold text-[15px] text-text">Visibility</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-text">Active</div>
                <div className="text-[12px] text-grey-400 mt-0.5">
                  Active products appear in the submission form
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                aria-label={form.active ? 'Deactivate' : 'Activate'}
                className="relative inline-flex h-[26px] w-[46px] cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 flex-shrink-0"
                style={{ background: form.active ? '#0066cc' : '#cbd5e1' }}
              >
                <span
                  className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: form.active ? 22 : 3 }}
                />
              </button>
            </div>
            {!form.active && (
              <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Inactive products are hidden from customers and cannot be added to new cases.
              </p>
            )}
          </div>
        </div>

        {/* Product Info (edit only) */}
        {isEdit && product && (
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-grey-100">
              <h2 className="font-semibold text-[15px] text-text">Product Info</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Created</span>
                <span className="text-text font-medium">
                  {new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Last updated</span>
                <span className="text-text font-medium">
                  {new Date(product.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Total cases</span>
                <span className="font-mono text-text font-medium">{totalCases}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Open cases</span>
                <span className={`font-mono font-medium ${openCases > 0 ? 'text-blue-600' : 'text-text'}`}>
                  {openCases}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone (edit + admin only) */}
        {isEdit && isAdmin && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100">
              <h2 className="font-semibold text-[15px] text-red-600">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-grey-500 mb-4">
                Permanently delete this product. Disabled if open cases reference it.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || openCases > 0}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete Product'}
              </button>
              {openCases > 0 && (
                <p className="mt-2 text-[11px] text-grey-400 text-center">
                  Cannot delete — {openCases} open case{openCases !== 1 ? 's' : ''} reference this product
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions — full width */}
      <div className="lg:col-span-2 flex items-center justify-between pt-2">
        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  )
}
