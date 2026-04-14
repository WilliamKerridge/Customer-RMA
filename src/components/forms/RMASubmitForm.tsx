'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Step1Contact, { type Step1Data } from './steps/Step1Contact'
import Step2Office, { type Step2Data } from './steps/Step2Office'
import Step3Products, { type Step3Data } from './steps/Step3Products'
import Step4Fault, { type Step4Data, type SelectedProduct } from './steps/Step4Fault'
import Step5Review, { type RMAFormData } from './steps/Step5Review'
import { createClient } from '@/lib/supabase/client'
import type { ProductRow, CustomerAccountRow } from '@/types/database'

export type { RMAFormData }

const STEP_LABELS = ['Contact', 'Office & Date', 'Products', 'Fault Details', 'Review']

interface Props {
  products: Pick<
    ProductRow,
    'id' | 'part_number' | 'variant' | 'display_name' | 'category' | 'test_fee' | 'standard_repair_fee' | 'major_repair_fee'
  >[]
  initialUser: {
    id: string
    name: string
    email: string
    company?: string | null
    phone?: string | null
  } | null
  account: CustomerAccountRow | null
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-5">
      {/* Circles + connectors */}
      <div className="flex items-start mb-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isDone = stepNum < current
          const isActive = stepNum === current

          return (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              {/* Connector line to next step */}
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`absolute top-3.5 h-0.5 z-0 ${isDone ? 'bg-green-500' : 'bg-grey-200'}`}
                  style={{ left: '50%', right: '-50%' }}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue text-white shadow-[0_0_0_4px_rgba(0,102,204,0.2)]'
                    : 'bg-grey-100 text-grey-300 border-2 border-grey-200'
                }`}
              >
                {isDone ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-[12px] font-semibold">{stepNum}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-1.5 text-[10px] font-semibold text-center leading-tight max-w-[64px] whitespace-nowrap ${
                  isDone ? 'text-green-600' : isActive ? 'text-blue' : 'text-grey-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress fill bar */}
      <div className="h-1 bg-grey-200 rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-blue rounded-full transition-all duration-300"
          style={{ width: `${((current - 1) / (STEP_LABELS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function RMASubmitForm({ products, initialUser, account }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState<RMAFormData>({
    step1: {
      full_name: initialUser?.name ?? '',
      company: initialUser?.company ?? '',
      email: initialUser?.email ?? '',
      phone: initialUser?.phone ?? '',
      street_address: '',
      city: '',
      postcode: '',
      country: 'GB',
    },
    step2: {
      office: 'UK',
      required_return_date: '',
      po_number: '',
    },
    step3: {
      products: [
        {
          id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
          product_id: '',
          serial_number: '',
          quantity: 1,
          fault_notes: '',
        },
      ],
      files: [],
    },
    step4: {
      product_faults: [],
    },
  })

  function handleStep1Next(data: Step1Data) {
    setFormData((prev) => ({ ...prev, step1: data }))
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStep2Next(data: Step2Data) {
    setFormData((prev) => ({ ...prev, step2: data }))
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStep3Next(data: Step3Data) {
    setFormData((prev) => ({ ...prev, step3: data }))
    setCurrentStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStep4Next(data: Step4Data) {
    setFormData((prev) => ({ ...prev, step4: data }))
    setCurrentStep(5)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack(toStep: number) {
    setCurrentStep(toStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Create the case
      const { product_faults } = formData.step4
      const multiProduct = product_faults.length > 1

      // Merge per-product fault type + description into the products array
      const productsWithFaults = formData.step3.products.map((p) => {
        const pf = product_faults.find((f) => f.entry_id === p.id)
        return {
          ...p,
          fault_type: pf?.fault_type ?? 'repair',
          // Store fault notes as "[Fault Type] description" so it's readable in admin
          fault_notes: pf?.fault_description || p.fault_notes || '',
        }
      })

      // Case-level fault_type: use first product's (required by DB schema)
      const primaryFaultType = product_faults[0]?.fault_type ?? 'repair'

      // Combine all fault descriptions for the case-level text field
      const combinedFaultDescription = product_faults
        .filter((pf) => pf.fault_description)
        .map((pf) => {
          const snPart = pf.serial_number ? ` (S/N: ${pf.serial_number})` : ''
          return multiProduct
            ? `[${pf.product_label}${snPart}] ${pf.fault_description}`
            : pf.fault_description
        })
        .join('\n\n')

      // For the case record, use the first product's repair diagnostic answers
      // (DB stores one set of these per case; if mixed types, repair fields take priority)
      const primaryPF = product_faults[0]

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: formData.step1,
          office: formData.step2.office,
          required_return_date: formData.step2.required_return_date,
          po_number: formData.step2.po_number,
          products: productsWithFaults,
          fault_type: primaryFaultType,
          fault_display_info: primaryPF?.fault_display_info ?? false,
          fault_display_details: primaryPF?.fault_display_details ?? null,
          tested_other_unit: primaryPF?.tested_other_unit ?? false,
          fault_follows: primaryPF?.fault_follows ?? null,
          fault_description: combinedFaultDescription,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Submission failed' }))
        throw new Error(err.message ?? 'Submission failed')
      }

      const { case_id, case_number } = (await response.json()) as {
        case_id: string
        case_number: string
      }

      // 2. Upload files to Supabase Storage (if any)
      if (formData.step3.files.length > 0) {
        const supabase = createClient()
        const uploadPromises = formData.step3.files.map(async (file) => {
          const path = `${case_id}/${Date.now()}_${file.name}`
          const { error } = await supabase.storage
            .from('case-attachments')
            .upload(path, file, { cacheControl: '3600' })

          if (error) {
            console.error('File upload failed:', file.name, error.message)
            return null
          }
          return { file_name: file.name, storage_path: path, file_size: file.size, mime_type: file.type }
        })

        const uploaded = (await Promise.all(uploadPromises)).filter(Boolean)

        // 3. Register attachment records
        if (uploaded.length > 0) {
          await fetch(`/api/cases/${case_id}/attachments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attachments: uploaded }),
          }).catch((e) => console.error('Attachment registration failed:', e))
        }
      }

      router.push(
        `/submit/success?caseId=${encodeURIComponent(case_id)}&caseNumber=${encodeURIComponent(case_number)}`
      )
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <StepBar current={currentStep} />

      {currentStep === 1 && (
        <Step1Contact
          data={formData.step1}
          onNext={handleStep1Next}
          isGuest={!initialUser}
        />
      )}

      {currentStep === 2 && (
        <Step2Office
          data={formData.step2}
          onNext={handleStep2Next}
          onBack={() => goBack(1)}
          poRequired={account?.po_required ?? false}
        />
      )}

      {currentStep === 3 && (
        <Step3Products
          data={formData.step3}
          onNext={handleStep3Next}
          onBack={() => goBack(2)}
          products={products}
        />
      )}

      {currentStep === 4 && (
        <Step4Fault
          data={formData.step4}
          onNext={handleStep4Next}
          onBack={() => goBack(3)}
          selectedProducts={formData.step3.products.map<SelectedProduct>((p) => {
            const product = products.find((pr) => pr.id === p.product_id)
            return {
              entry_id: p.id,
              product_id: p.product_id,
              product_label: product
                ? `${product.display_name}${product.variant ? ` ${product.variant}` : ''}`
                : 'Product',
              serial_number: p.serial_number ?? '',
              prefill_notes: p.fault_notes ?? '',
            }
          })}
        />
      )}

      {currentStep === 5 && (
        <Step5Review
          formData={formData}
          products={products}
          account={account}
          onBack={() => goBack(4)}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}
