'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const FAULT_TYPES = [
  { value: 'repair',       label: 'Repair' },
  { value: 'service',      label: 'End of Season Service' },
  { value: 'service_plan', label: 'Service Plan' },
  { value: 'loan_return',  label: 'Loan Unit Return' },
  { value: 'code_update',  label: 'Code Update' },
] as const

type FaultTypeValue = (typeof FAULT_TYPES)[number]['value']

const productFaultSchema = z.object({
  entry_id: z.string(),
  product_id: z.string(),
  product_label: z.string(),
  serial_number: z.string().optional(),
  fault_type: z.enum(['repair', 'service', 'service_plan', 'loan_return', 'code_update']),
  // Repair-only diagnostic fields
  fault_display_info: z.boolean().optional(),
  fault_display_details: z.string().optional(),
  tested_other_unit: z.boolean().optional(),
  fault_follows: z.enum(['unit', 'car']).optional(),
  // Description — required for repair, optional otherwise
  fault_description: z.string().optional(),
})

const schema = z
  .object({
    product_faults: z.array(productFaultSchema),
  })
  .refine(
    (d) =>
      d.product_faults.every(
        (pf) => pf.fault_type !== 'repair' || (pf.fault_description ?? '').trim().length > 0
      ),
    { message: 'Fault description is required for each Repair item', path: ['product_faults'] }
  )
  .refine(
    (d) =>
      d.product_faults.every(
        (pf) =>
          !pf.fault_display_info || (pf.fault_display_details ?? '').trim().length > 0
      ),
    { message: 'Please describe what was displayed', path: ['product_faults'] }
  )

export type Step4Data = z.infer<typeof schema>

export interface SelectedProduct {
  entry_id: string
  product_id: string
  product_label: string
  serial_number: string
  prefill_notes: string
}

interface Props {
  data: Step4Data
  onNext: (data: Step4Data) => void
  onBack: () => void
  selectedProducts: SelectedProduct[]
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-[12.5px] text-center font-semibold border-2 transition-all ${
        active
          ? 'border-blue bg-blue/5 text-blue'
          : 'border-grey-200 bg-white text-grey-500 hover:border-grey-300'
      }`}
    >
      {children}
    </button>
  )
}

export default function Step4Fault({ data, onNext, onBack, selectedProducts }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step4Data>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_faults: selectedProducts.map((sp) => {
        const existing = data.product_faults?.find((pf) => pf.entry_id === sp.entry_id)
        return {
          entry_id: sp.entry_id,
          product_id: sp.product_id,
          product_label: sp.product_label,
          serial_number: sp.serial_number,
          fault_type: existing?.fault_type ?? 'repair',
          fault_display_info: existing?.fault_display_info ?? false,
          fault_display_details: existing?.fault_display_details ?? '',
          tested_other_unit: existing?.tested_other_unit ?? false,
          fault_follows: existing?.fault_follows ?? 'unit',
          fault_description: existing?.fault_description ?? sp.prefill_notes,
        }
      }),
    },
  })

  const { fields } = useFieldArray({ control, name: 'product_faults' })

  type PFError = {
    fault_description?: { message?: string }
    fault_display_details?: { message?: string }
  }
  const productFaultErrors = (errors.product_faults ?? []) as (PFError | undefined)[]

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">Fault Details</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">
            Step 4 of 5
          </span>
        </div>
        <div className="p-[22px]">
          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentFaultType = watch(`product_faults.${index}.fault_type`) as FaultTypeValue
              const isRepair = currentFaultType === 'repair'
              const faultDisplayInfo = watch(`product_faults.${index}.fault_display_info`)
              const descError = productFaultErrors[index]?.fault_description
              const displayDetailsError = productFaultErrors[index]?.fault_display_details

              return (
                <div
                  key={field.id}
                  className="border-[1.5px] border-grey-200 rounded-[10px] overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-grey-50 border-b border-grey-200">
                    <div className="w-7 h-7 rounded-lg bg-blue/10 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-text truncate">
                        {field.product_label}
                      </div>
                      {field.serial_number ? (
                        <div className="text-[11px] text-grey-400 font-mono">S/N: {field.serial_number}</div>
                      ) : (
                        <div className="text-[11px] text-grey-400 italic">No serial number provided</div>
                      )}
                    </div>
                    {fields.length > 1 && (
                      <span className="text-[11px] font-semibold text-grey-400 flex-shrink-0">
                        Item {index + 1} of {fields.length}
                      </span>
                    )}
                  </div>

                  {/* Hidden registry fields */}
                  <input type="hidden" {...register(`product_faults.${index}.entry_id`)} />
                  <input type="hidden" {...register(`product_faults.${index}.product_id`)} />
                  <input type="hidden" {...register(`product_faults.${index}.product_label`)} />
                  <input type="hidden" {...register(`product_faults.${index}.serial_number`)} />

                  <div className="p-4 space-y-4">
                    {/* Fault type */}
                    <div>
                      <label className="block text-[13px] font-semibold text-grey-700 mb-2">
                        Fault Type <span className="text-blue ml-0.5">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FAULT_TYPES.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue(`product_faults.${index}.fault_type`, value)}
                            className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold border-2 transition-all ${
                              currentFaultType === value
                                ? 'border-blue bg-blue/5 text-blue'
                                : 'border-grey-200 bg-white text-grey-500 hover:border-grey-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <input type="hidden" {...register(`product_faults.${index}.fault_type`)} />
                    </div>

                    {/* Repair-only diagnostic questions */}
                    {isRepair && (
                      <>
                        <div className="h-px bg-grey-100" />

                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Was fault info displayed? */}
                          <div>
                            <label className="block text-[12.5px] font-semibold text-grey-700 mb-2">
                              Was fault information displayed on the unit?
                            </label>
                            <div className="flex gap-2">
                              <ToggleBtn
                                active={faultDisplayInfo === false}
                                onClick={() => setValue(`product_faults.${index}.fault_display_info`, false)}
                              >
                                No
                              </ToggleBtn>
                              <ToggleBtn
                                active={faultDisplayInfo === true}
                                onClick={() => setValue(`product_faults.${index}.fault_display_info`, true)}
                              >
                                Yes
                              </ToggleBtn>
                            </div>
                            <input type="hidden" {...register(`product_faults.${index}.fault_display_info`)} />
                          </div>

                          {/* Tested on another car? */}
                          <div>
                            <label className="block text-[12.5px] font-semibold text-grey-700 mb-2">
                              Have you tested the unit on another car?
                            </label>
                            <div className="flex gap-2">
                              <ToggleBtn
                                active={watch(`product_faults.${index}.tested_other_unit`) === false}
                                onClick={() => setValue(`product_faults.${index}.tested_other_unit`, false)}
                              >
                                No
                              </ToggleBtn>
                              <ToggleBtn
                                active={watch(`product_faults.${index}.tested_other_unit`) === true}
                                onClick={() => setValue(`product_faults.${index}.tested_other_unit`, true)}
                              >
                                Yes
                              </ToggleBtn>
                            </div>
                            <input type="hidden" {...register(`product_faults.${index}.tested_other_unit`)} />
                          </div>
                        </div>

                        {/* Does fault follow unit or car? */}
                        <div>
                          <label className="block text-[12.5px] font-semibold text-grey-700 mb-2">
                            Does the fault follow the unit or the car?
                          </label>
                          <div className="flex gap-2 max-w-[260px]">
                            <ToggleBtn
                              active={watch(`product_faults.${index}.fault_follows`) === 'unit'}
                              onClick={() => setValue(`product_faults.${index}.fault_follows`, 'unit')}
                            >
                              Unit
                            </ToggleBtn>
                            <ToggleBtn
                              active={watch(`product_faults.${index}.fault_follows`) === 'car'}
                              onClick={() => setValue(`product_faults.${index}.fault_follows`, 'car')}
                            >
                              Car
                            </ToggleBtn>
                          </div>
                          <input type="hidden" {...register(`product_faults.${index}.fault_follows`)} />
                        </div>

                        {/* Conditional: what was displayed */}
                        {faultDisplayInfo && (
                          <div>
                            <label className="block text-[12.5px] font-semibold text-grey-700 mb-1.5">
                              Please describe what was displayed <span className="text-blue ml-0.5">*</span>
                            </label>
                            <input
                              {...register(`product_faults.${index}.fault_display_details`)}
                              className={`w-full px-3.5 py-[9px] border-[1.5px] rounded-lg text-[13.5px] text-text bg-white outline-none transition-all ${
                                displayDetailsError
                                  ? 'border-red-400'
                                  : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
                              }`}
                              placeholder="e.g. Error code E004 on screen, unit shut down…"
                            />
                            {displayDetailsError && (
                              <p className="mt-1 text-[11px] text-red-500">{displayDetailsError.message}</p>
                            )}
                          </div>
                        )}

                        <div className="h-px bg-grey-100" />
                      </>
                    )}

                    {/* Fault description */}
                    <div>
                      <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                        Fault Description
                        {isRepair && <span className="text-blue ml-0.5">*</span>}
                      </label>
                      <textarea
                        {...register(`product_faults.${index}.fault_description`)}
                        rows={3}
                        className={`w-full px-3.5 py-[9px] border-[1.5px] rounded-lg text-[13.5px] text-text bg-white outline-none transition-all resize-y ${
                          descError
                            ? 'border-red-400'
                            : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
                        }`}
                        placeholder="Describe the fault in as much detail as possible…"
                      />
                      {descError && (
                        <p className="mt-1 text-[11px] text-red-500">{descError.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

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
              Next
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
