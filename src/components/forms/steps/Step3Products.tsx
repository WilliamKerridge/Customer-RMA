'use client'

import { useRef, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ProductRow } from '@/types/database'

const productEntrySchema = z.object({
  id: z.string(),
  product_id: z.string().min(1, 'Please select a product'),
  serial_number: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  fault_notes: z.string().optional(),
})

const schema = z.object({
  products: z.array(productEntrySchema).min(1, 'At least one product is required'),
})

export type ProductEntry = z.infer<typeof productEntrySchema>
export type Step3Data = {
  products: ProductEntry[]
  files: File[]
}

const inputClass =
  'w-full px-3.5 py-[9px] border-[1.5px] border-grey-200 rounded-lg text-[13.5px] text-text bg-white outline-none transition-all focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'

interface Props {
  data: Step3Data
  onNext: (data: Step3Data) => void
  onBack: () => void
  products: Pick<ProductRow, 'id' | 'part_number' | 'variant' | 'display_name' | 'category'>[]
}

// Group products by category
function groupByCategory(
  products: Pick<ProductRow, 'id' | 'part_number' | 'variant' | 'display_name' | 'category'>[]
) {
  return products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})
}

export default function Step3Products({ data, onNext, onBack, products }: Props) {
  const [files, setFiles] = useState<File[]>(data.files)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{ products: ProductEntry[] }>({
    resolver: zodResolver(schema),
    defaultValues: { products: data.products },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'products' })

  const grouped = groupByCategory(products)
  const categories = Object.keys(grouped).sort()

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    setFiles((prev) => {
      const combined = [...prev, ...picked]
      return combined.slice(0, 10) // max 10 files
    })
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function onSubmit(values: { products: ProductEntry[] }) {
    onNext({ products: values.products, files })
  }

  function addProduct() {
    append({
      id: crypto.randomUUID(),
      product_id: '',
      serial_number: '',
      quantity: 1,
      fault_notes: '',
    })
  }

  const productErrors = errors.products

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">Products &amp; Fees</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">
            Step 3 of 5
          </span>
        </div>
        <div className="p-[22px]">
          <div className="space-y-3 mb-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border-[1.5px] border-grey-200 rounded-[10px] p-[18px] bg-grey-50"
              >
                {/* Product header */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-bold text-blue bg-blue/10 px-2.5 py-0.5 rounded-full">
                    Product {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-[12px] text-grey-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Hidden id field */}
                <input type="hidden" {...register(`products.${index}.id`)} />

                {/* Product select */}
                <div className="mb-3.5">
                  <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                    Product <span className="text-blue ml-0.5">*</span>
                  </label>
                  <select
                    {...register(`products.${index}.product_id`)}
                    className={`w-full px-3.5 py-[9px] border-[1.5px] rounded-lg text-[13.5px] text-text bg-white outline-none transition-all ${
                      productErrors?.[index]?.product_id
                        ? 'border-red-400'
                        : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
                    }`}
                  >
                    <option value="">— Select product —</option>
                    {categories.map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {grouped[cat].map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.part_number}
                            {p.variant ? ` ${p.variant}` : ''} — {p.display_name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {productErrors?.[index]?.product_id && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {productErrors[index]?.product_id?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                  <div>
                    <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                      Serial Number
                    </label>
                    <input
                      {...register(`products.${index}.serial_number`)}
                      className={inputClass}
                      placeholder="e.g. CEL-20250112"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                      Quantity
                    </label>
                    <input
                      {...register(`products.${index}.quantity`, { valueAsNumber: true })}
                      type="number"
                      min={1}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                    Fault Notes
                  </label>
                  <textarea
                    {...register(`products.${index}.fault_notes`)}
                    rows={2}
                    className="w-full px-3.5 py-[9px] border-[1.5px] border-grey-200 rounded-lg text-[13.5px] text-text bg-white outline-none transition-all focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)] resize-y"
                    placeholder="Describe the specific fault with this unit…"
                  />
                </div>
              </div>
            ))}
          </div>

          {fields.length < 10 && (
            <button
              type="button"
              onClick={addProduct}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-grey-600 hover:bg-grey-100 hover:text-text transition-all mb-5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Another Product
            </button>
          )}

          {/* File upload zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            className="border-2 border-dashed border-grey-300 rounded-[10px] p-7 text-center cursor-pointer bg-grey-50 hover:border-blue/50 hover:bg-blue/5 transition-all"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[13px] font-medium text-grey-600">Click to upload fault evidence</p>
            <p className="text-[11px] text-grey-400 mt-1">Photos, diagnostic logs — max 10 files, 10MB each</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.log,.csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFilePick}
          />

          {/* Selected files */}
          {files.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-grey-50 border border-grey-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-[12px] text-grey-700 truncate">{file.name}</span>
                    <span className="text-[11px] text-grey-400 flex-shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-grey-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-text border border-grey-300 hover:bg-grey-50 transition-all"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)]"
            >
              Continue to Fault Details
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
