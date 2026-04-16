'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  office: z.enum(['UK', 'US']),
  required_return_date: z
    .string()
    .min(1, 'Return date is required')
    .refine(
      (val) => {
        const d = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return d >= today
      },
      { message: 'Return date cannot be in the past' }
    ),
  po_number: z.string().optional(),
})

export type Step2Data = z.infer<typeof schema>

// Min date for the date input (today in YYYY-MM-DD)
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const inputClass =
  'w-full px-3.5 py-[9px] border-[1.5px] border-grey-200 rounded-lg text-[13.5px] text-text bg-white outline-none transition-all focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'

interface Props {
  data: Step2Data
  onNext: (data: Step2Data) => void
  onBack: () => void
  poRequired: boolean
}

export default function Step2Office({ data, onNext, onBack, poRequired }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(schema),
    defaultValues: data,
  })

  const selectedOffice = watch('office')

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">Office &amp; Return Details</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">
            Step 2 of 5
          </span>
        </div>
        <div className="p-[22px]">
          {/* Office selection */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-grey-700 mb-2">
              Cosworth Office <span className="text-blue ml-0.5">*</span>
            </label>
            <div className="flex gap-3">
              {/* UK card */}
              <button
                type="button"
                onClick={() => setValue('office', 'UK')}
                className={`flex-1 flex items-center gap-2.5 px-[18px] py-3.5 rounded-[10px] border-2 cursor-pointer text-left transition-all ${
                  selectedOffice === 'UK'
                    ? 'border-blue bg-blue/5'
                    : 'border-grey-200 bg-white hover:border-grey-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedOffice === 'UK' ? 'border-blue bg-blue' : 'border-grey-300'
                  }`}
                >
                  {selectedOffice === 'UK' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-text">Cosworth Electronics UK</div>
                  <div className="text-[11px] text-grey-400">Cambridge, CB24 8PS</div>
                </div>
              </button>

              {/* US card */}
              <button
                type="button"
                onClick={() => setValue('office', 'US')}
                className={`flex-1 flex items-center gap-2.5 px-[18px] py-3.5 rounded-[10px] border-2 cursor-pointer text-left transition-all ${
                  selectedOffice === 'US'
                    ? 'border-blue bg-blue/5'
                    : 'border-grey-200 bg-white hover:border-grey-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedOffice === 'US' ? 'border-blue bg-blue' : 'border-grey-300'
                  }`}
                >
                  {selectedOffice === 'US' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-text">Cosworth Electronics USA</div>
                  <div className="text-[11px] text-grey-400">Indianapolis, IN 46268</div>
                </div>
              </button>
            </div>
            {/* Hidden input to register the field */}
            <input type="hidden" {...register('office')} />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                Required Return Date <span className="text-blue ml-0.5">*</span>
              </label>
              <input
                {...register('required_return_date')}
                type="date"
                min={todayISO()}
                className={`w-full px-3.5 py-[9px] border-[1.5px] rounded-lg text-[13.5px] text-text bg-white outline-none transition-all ${
                  errors.required_return_date
                    ? 'border-red-400'
                    : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
                }`}
              />
              <p className="mt-1 text-[11px] text-grey-400">Earliest date you need the unit back</p>
              {errors.required_return_date && (
                <p className="mt-1 text-[11px] text-red-500">{errors.required_return_date.message}</p>
              )}
            </div>

            {poRequired && (
              <div>
                <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                  Purchase Order Number <span className="text-blue ml-0.5">*</span>
                </label>
                <input
                  {...register('po_number')}
                  className={inputClass}
                  placeholder="PO-2026-XXXX"
                />
                <p className="mt-1 text-[11px] text-grey-400">Required for your account</p>
              </div>
            )}
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
