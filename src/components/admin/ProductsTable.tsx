'use client'

import React, { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ProductRow } from '@/types/database'
import { Pencil } from 'lucide-react'

const CATEGORY_COLOURS: Record<string, { bg: string; text: string }> = {
  'Engine Management': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Engine Management Systems': { bg: 'bg-slate-100', text: 'text-slate-700' },
  Displays: { bg: 'bg-purple-50', text: 'text-purple-700' },
  Loggers: { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Power Systems': { bg: 'bg-orange-50', text: 'text-orange-700' },
  'Steering Wheels': { bg: 'bg-green-50', text: 'text-green-700' },
  Looms: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'Wind Tunnel': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  Defence: { bg: 'bg-red-50', text: 'text-red-700' },
}

function categoryBadge(cat: string) {
  const c = CATEGORY_COLOURS[cat] ?? { bg: 'bg-grey-100', text: 'text-grey-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {cat}
    </span>
  )
}

function formatFee(n: number) {
  return `£${n.toLocaleString('en-GB')}`
}

type FeeField = 'test_fee' | 'standard_repair_fee' | 'major_repair_fee'

interface EditingCell {
  productId: string
  field: FeeField
}

interface FlashCell {
  productId: string
  field: FeeField
}

interface ProductsTableProps {
  initialProducts: ProductRow[]
}

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductRow[]>(initialProducts)
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState('')
  const [flash, setFlash] = useState<FlashCell | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(product: ProductRow, field: FeeField) {
    setEditing({ productId: product.id, field })
    setEditValue(String(product[field]))
    setTimeout(() => inputRef.current?.select(), 10)
  }

  async function commitEdit(product: ProductRow, field: FeeField) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      setEditing(null)
      return
    }
    setEditing(null)

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, [field]: val } : p))
    )

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: val }),
      })
      if (!res.ok) throw new Error('Failed')

      setFlash({ productId: product.id, field })
      setTimeout(() => setFlash(null), 1200)
      startTransition(() => router.refresh())
    } catch {
      // Roll back on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, [field]: product[field] } : p))
      )
    }
  }

  async function toggleActive(product: ProductRow) {
    const next = !product.active
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: next } : p))
    )

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      if (!res.ok) throw new Error('Failed')
      startTransition(() => router.refresh())
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: product.active } : p))
      )
    }
  }

  function feeCell(product: ProductRow, field: FeeField, colourClass: string) {
    const isEditing = editing?.productId === product.id && editing.field === field
    const isFlashing = flash?.productId === product.id && flash.field === field

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="50"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(product, field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit(product, field)
            if (e.key === 'Escape') setEditing(null)
          }}
          className="w-24 px-2 py-1 border-2 border-blue-500 rounded text-right font-mono text-[13px] outline-none bg-white"
        />
      )
    }

    return (
      <div
        onClick={() => startEdit(product, field)}
        title="Click to edit"
        className={`
          inline-flex items-center gap-1 font-mono text-[13px] cursor-pointer
          px-2 py-1 rounded transition-all duration-150
          ${isFlashing ? 'bg-green-100 text-green-700' : `hover:${colourClass} hover:text-white`}
        `}
      >
        {formatFee(product[field])}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 860 }}>
        <thead>
          <tr className="bg-grey-50 border-b border-grey-200">
            <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3 w-32">
              Product
            </th>
            <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3 w-36">
              Category
            </th>
            <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">
              Description
            </th>
            <th className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28 border-l border-grey-200" style={{ color: '#0066cc' }}>
              Test Fee
            </th>
            <th className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32" style={{ color: '#7c3aed' }}>
              Standard Repair
            </th>
            <th className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 w-28" style={{ color: '#b45309' }}>
              Major Repair
            </th>
            <th className="text-center text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3 w-16">
              Active
            </th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-sm text-grey-400 py-12">
                No products found.
              </td>
            </tr>
          )}
          {products.map((product) => (
            <tr
              key={product.id}
              className={`border-b border-grey-100 last:border-0 transition-colors duration-150 ${
                !product.active ? 'opacity-50' : ''
              }`}
            >
              <td className="px-4 py-3.5">
                <span className="font-mono text-[12px] text-blue-600">{product.part_number}</span>
                {product.variant && (
                  <div className="text-[11px] text-grey-400 mt-0.5">{product.variant}</div>
                )}
              </td>
              <td className="px-4 py-3.5">{categoryBadge(product.category)}</td>
              <td className="px-4 py-3.5">
                <div className="font-semibold text-[13.5px] text-text">{product.display_name}</div>
                {product.notes && (
                  <div className="text-[11px] text-grey-400 mt-0.5 truncate max-w-xs">{product.notes}</div>
                )}
              </td>
              <td className="px-4 py-3.5 text-right border-l border-grey-100">
                {feeCell(product, 'test_fee', 'bg-blue-500')}
              </td>
              <td className="px-4 py-3.5 text-right">
                {feeCell(product, 'standard_repair_fee', 'bg-purple-500')}
              </td>
              <td className="px-4 py-3.5 text-right">
                {feeCell(product, 'major_repair_fee', 'bg-amber-500')}
              </td>
              <td className="px-4 py-3.5 text-center">
                <button
                  onClick={() => toggleActive(product)}
                  aria-label={product.active ? 'Deactivate product' : 'Activate product'}
                  className="relative inline-flex h-[22px] w-[38px] cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                  style={{ background: product.active ? '#0066cc' : '#cbd5e1' }}
                >
                  <span
                    className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: product.active ? 18 : 2 }}
                  />
                </button>
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-grey-600 hover:text-text px-2.5 py-1.5 rounded-lg border border-grey-200 hover:bg-grey-50 transition-all duration-150"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 border-t border-grey-100 flex items-center justify-between">
        <div className="text-[12px] text-grey-500">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}&nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="text-green-600 font-semibold">{products.filter((p) => p.active).length} active</span>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="text-grey-400">{products.filter((p) => !p.active).length} inactive</span>
        </div>
        <div className="text-[11px] text-grey-400">Click any fee cell to edit inline</div>
      </div>
    </div>
  )
}
