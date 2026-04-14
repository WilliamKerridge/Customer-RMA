'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  caseId: string
  sapSalesOrder:          string | null
  sapWorksOrder:          string | null
  sapEstimatedCompletion: string | null
  sapOrderValue:          number | null
  sapSpentHours:          number | null
  sapDaysOpen:            number | null
  lastImportAt:           string | null
  // When set, saves to the product-level notes route instead of the case SAP route.
  // Sales order is case-level only and is hidden from the product-scoped card.
  // When undefined AND isMultiProductAggregate is true, the card is read-only
  // (showing aggregated totals that can't be edited directly).
  productId?:                  string
  isMultiProductAggregate?:    boolean
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AdminSapCard({
  caseId,
  sapSalesOrder,
  sapWorksOrder,
  sapEstimatedCompletion,
  sapOrderValue,
  sapSpentHours,
  sapDaysOpen,
  lastImportAt,
  productId,
  isMultiProductAggregate = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    sap_sales_order:          sapSalesOrder ?? '',
    sap_works_order:          sapWorksOrder ?? '',
    sap_estimated_completion: sapEstimatedCompletion ?? '',
    sap_order_value:          sapOrderValue != null ? String(sapOrderValue) : '',
    sap_spent_hours:          sapSpentHours != null ? String(sapSpentHours) : '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      let url: string
      let payload: Record<string, unknown>

      if (productId) {
        // Product-level save — works order + financial fields only
        url = `/api/cases/${caseId}/products/${productId}/notes`
        payload = {
          sap_works_order:          form.sap_works_order.trim() || null,
          sap_estimated_completion: form.sap_estimated_completion || null,
          sap_order_value:          form.sap_order_value !== '' ? parseFloat(form.sap_order_value) : null,
          sap_spent_hours:          form.sap_spent_hours !== '' ? parseFloat(form.sap_spent_hours) : null,
        }
      } else {
        // Case-level save — all SAP fields
        url = `/api/cases/${caseId}/sap`
        payload = {
          sap_sales_order:          form.sap_sales_order.trim() || null,
          sap_works_order:          form.sap_works_order.trim() || null,
          sap_estimated_completion: form.sap_estimated_completion || null,
          sap_order_value:          form.sap_order_value !== '' ? parseFloat(form.sap_order_value) : null,
          sap_spent_hours:          form.sap_spent_hours !== '' ? parseFloat(form.sap_spent_hours) : null,
        }
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? 'Failed to save')
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // When in product mode, sales order is a case-level read-only field
  const isProductMode = !!productId

  const displayRows = isProductMode
    ? [
        { label: 'Works Order',     value: sapWorksOrder },
        { label: 'Order Value',     value: sapOrderValue  != null ? `£${Number(sapOrderValue).toFixed(2)}`  : null },
        { label: 'Spent Hours',     value: sapSpentHours  != null ? `${sapSpentHours}h`                     : null },
        { label: 'Est. Completion', value: formatDate(sapEstimatedCompletion) },
      ]
    : [
        { label: 'Order Value',     value: sapOrderValue  != null ? `£${Number(sapOrderValue).toFixed(2)}`  : null },
        { label: 'Spent Hours',     value: sapSpentHours  != null ? `${sapSpentHours}h`                     : null },
        { label: 'Days Open',       value: sapDaysOpen    != null ? String(sapDaysOpen)                     : null },
        { label: 'Est. Completion', value: formatDate(sapEstimatedCompletion) },
        { label: 'Sales Order',     value: sapSalesOrder },
        { label: 'Works Order',     value: sapWorksOrder },
      ]

  const editFields = isProductMode
    ? [
        { label: 'Works Order',     name: 'sap_works_order',          type: 'text',   placeholder: 'e.g. 7654321' },
        { label: 'Est. Completion', name: 'sap_estimated_completion', type: 'date',   placeholder: '' },
        { label: 'Order Value (£)', name: 'sap_order_value',          type: 'number', placeholder: '0.00' },
        { label: 'Spent Hours',     name: 'sap_spent_hours',          type: 'number', placeholder: '0.0' },
      ]
    : [
        { label: 'Sales Order',     name: 'sap_sales_order',          type: 'text',   placeholder: 'e.g. 1234567' },
        { label: 'Works Order',     name: 'sap_works_order',          type: 'text',   placeholder: 'e.g. 7654321' },
        { label: 'Est. Completion', name: 'sap_estimated_completion', type: 'date',   placeholder: '' },
        { label: 'Order Value (£)', name: 'sap_order_value',          type: 'number', placeholder: '0.00' },
        { label: 'Spent Hours',     name: 'sap_spent_hours',          type: 'number', placeholder: '0.0' },
      ]

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-grey-100 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm font-semibold text-text">SAP Data</h2>
          {isMultiProductAggregate && (
            <p className="text-[10px] text-grey-400 mt-0.5">Totals across all products — select a product to edit</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastImportAt && !editing && (
            <span className="font-mono text-[10px] text-grey-400">
              Synced {formatDate(lastImportAt)}
            </span>
          )}
          {!isMultiProductAggregate && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md text-grey-400 hover:text-text hover:bg-grey-100 transition-colors"
              aria-label="Edit SAP data"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => { setEditing(false); setError(null) }}
                className="px-3 py-1 rounded-md text-[11px] font-semibold text-grey-600 bg-grey-100 hover:bg-grey-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 rounded-md text-[11px] font-semibold text-white bg-navy hover:bg-navy-mid transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-[12px] text-red-600">{error}</div>
      )}

      <div className="divide-y divide-grey-100">
        {editing ? (
          editFields.map(({ label, name, type, placeholder }) => (
            <div key={name} className="grid grid-cols-2 items-center px-4 py-2">
              <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em]">{label}</span>
              <input
                type={type}
                name={name}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                placeholder={placeholder}
                step={type === 'number' ? '0.01' : undefined}
                min={type === 'number' ? '0' : undefined}
                className="w-full text-[12.5px] text-text font-medium border border-grey-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
              />
            </div>
          ))
        ) : (
          displayRows.map(({ label, value }) => (
            <div key={label} className="grid grid-cols-2 px-4 py-2.5">
              <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em]">{label}</span>
              <span className="text-[13px] text-text font-medium">{value ?? '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
