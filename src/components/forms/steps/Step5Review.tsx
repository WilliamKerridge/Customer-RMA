'use client'

import type { Step1Data } from './Step1Contact'
import type { Step2Data } from './Step2Office'
import type { Step3Data } from './Step3Products'
import type { Step4Data } from './Step4Fault'
import type { ProductRow, CustomerAccountRow } from '@/types/database'

export type RMAFormData = {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
}

const FAULT_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair',
  service: 'End of Season Service',
  service_plan: 'Service Plan',
  loan_return: 'Loan Unit Return',
  code_update: 'Code Update',
}

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom',
  US: 'United States',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  AU: 'Australia',
  JP: 'Japan',
  CA: 'Canada',
  BR: 'Brazil',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  FI: 'Finland',
}

interface Props {
  formData: RMAFormData
  products: Pick<ProductRow, 'id' | 'part_number' | 'display_name' | 'variant' | 'test_fee'>[]
  account: CustomerAccountRow | null
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  submitError: string | null
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-grey-50 border border-grey-200 rounded-[10px] p-4 mb-3.5">
      <div className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-2.5">
        {title}
      </div>
      {children}
    </div>
  )
}

export default function Step5Review({
  formData,
  products,
  account,
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
}: Props) {
  const { step1, step2, step3, step4 } = formData

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const hasCreditTerms = account?.credit_terms === true
  const totalTestFee = step3.products.reduce((sum, p) => {
    const product = productMap[p.product_id]
    return sum + (product ? product.test_fee * p.quantity : 0)
  }, 0)

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-text">Review &amp; Submit</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">
          Step 5 of 5
        </span>
      </div>
      <div className="p-[22px]">
        {/* Contact + Return Details — 2-col grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <ReviewSection title="Contact">
            <div className="text-[13.5px] font-semibold">{step1.full_name}</div>
            <div className="text-[13px] text-grey-500">{step1.company}</div>
            <div className="text-[13px] text-grey-500">{step1.email}</div>
            {step1.phone && (
              <div className="text-[13px] text-grey-500">{step1.phone}</div>
            )}
          </ReviewSection>

          <ReviewSection title="Return Details">
            <div className="text-[13.5px] font-semibold">
              Cosworth Electronics {step2.office === 'UK' ? 'UK' : 'USA'}
            </div>
            <div className="text-[13px] text-grey-500">
              Required by: {formatDate(step2.required_return_date)}
            </div>
            {step2.po_number && (
              <div className="text-[13px] text-grey-500">PO: {step2.po_number}</div>
            )}
            <div className="text-[13px] text-grey-500 mt-1">
              {step1.street_address}
              {step1.city ? `, ${step1.city}` : ''}
              {step1.postcode ? ` ${step1.postcode}` : ''}
              {step1.country ? `, ${COUNTRY_NAMES[step1.country] ?? step1.country}` : ''}
            </div>
          </ReviewSection>
        </div>

        {/* Products */}
        <ReviewSection title="Products &amp; Fees">
          <div className="space-y-3">
            {step3.products.map((p, i) => {
              const product = productMap[p.product_id]
              // Match on entry_id so two identical parts are kept separate
              const pf = step4.product_faults.find((f) => f.entry_id === p.id)
              const faultTypeLabel = pf ? FAULT_TYPE_LABELS[pf.fault_type] : '—'
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {product ? (
                      <>
                        <div className="text-[13.5px] font-semibold">
                          {product.display_name}
                          {product.variant ? ` ${product.variant}` : ''} — {product.part_number}
                        </div>
                        <div className="text-[12px] text-grey-500">
                          {p.serial_number ? `S/N: ${p.serial_number} · ` : ''}
                          Qty: {p.quantity}
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-grey-600 bg-grey-100 px-2 py-0.5 rounded-full">
                          {faultTypeLabel}
                        </span>
                      </>
                    ) : (
                      <div className="text-[13px] text-grey-500">Product {i + 1}</div>
                    )}
                  </div>
                  {product && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] text-grey-400">Inspection fee</div>
                      <div className="text-[13px] font-semibold text-text">
                        £{(product.test_fee * p.quantity).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Files */}
          {step3.files.length > 0 && (
            <div className="mt-3 pt-3 border-t border-grey-200">
              <div className="text-[11px] text-grey-400 mb-1.5">
                {step3.files.length} file{step3.files.length !== 1 ? 's' : ''} attached
              </div>
              <div className="flex flex-wrap gap-1.5">
                {step3.files.map((f, i) => (
                  <span key={i} className="text-[11px] text-grey-600 bg-grey-100 px-2 py-0.5 rounded">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ReviewSection>

        {/* Fault Details — per product */}
        <ReviewSection title="Fault Details">
          <div className="space-y-4">
            {step4.product_faults.map((pf, i) => {
              const isRepair = pf.fault_type === 'repair'
              return (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-grey-200' : ''}>
                  {/* Product identifier when multiple */}
                  {step4.product_faults.length > 1 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px] font-semibold text-text">
                        {pf.product_label}
                      </span>
                      {pf.serial_number && (
                        <span className="text-[11px] text-grey-400 font-mono">S/N: {pf.serial_number}</span>
                      )}
                    </div>
                  )}

                  {/* Fault type badge */}
                  <span className="inline-block mb-2 text-[11px] font-semibold text-grey-600 bg-grey-100 px-2.5 py-0.5 rounded-full">
                    {FAULT_TYPE_LABELS[pf.fault_type]}
                  </span>

                  {/* Repair diagnostic answers */}
                  {isRepair && (
                    <div className="text-[12.5px] text-grey-600 space-y-0.5 mb-2">
                      <div>
                        <span className="font-semibold">Fault follows: </span>
                        {pf.fault_follows === 'unit' ? 'Unit' : pf.fault_follows === 'car' ? 'Car' : '—'}
                      </div>
                      <div>
                        <span className="font-semibold">Fault info displayed: </span>
                        {pf.fault_display_info ? 'Yes' : 'No'}
                        {pf.fault_display_info && pf.fault_display_details
                          ? ` — ${pf.fault_display_details}`
                          : ''}
                      </div>
                      <div>
                        <span className="font-semibold">Tested on another car: </span>
                        {pf.tested_other_unit ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}

                  {/* Fault description */}
                  {pf.fault_description && (
                    <p className="text-[13px] text-grey-600 italic">
                      &ldquo;{pf.fault_description}&rdquo;
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </ReviewSection>

        {/* Payment / credit terms notice */}
        {hasCreditTerms ? (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-300 rounded-[10px] px-4 py-3.5 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div className="text-[13px] text-green-800">
              <strong>Credit Terms Active</strong>
              {step2.po_number ? ` — PO ${step2.po_number} will be referenced on your invoice.` : ' — No upfront payment required.'}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3.5 mb-4">
            <div className="text-[13px] text-amber-800">
              <strong>Payment Notice</strong>{' '}
              {totalTestFee > 0 && `An inspection fee of £${totalTestFee.toFixed(2)} is required. `}
              A member of our team will contact you within 24 hours to arrange payment before your RMA is issued.
            </div>
          </div>
        )}

        {/* Submission error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 mb-4 text-[13px] text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-text border border-grey-300 hover:bg-grey-50 transition-all disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Submit Return Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
