'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional(),
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
})

export type Step1Data = z.infer<typeof schema>

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'FI', name: 'Finland' },
]

const inputClass = (hasError: boolean) =>
  `w-full px-3.5 py-[9px] border-[1.5px] rounded-lg text-[13.5px] text-text bg-white outline-none transition-all ${
    hasError
      ? 'border-red-400'
      : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
  }`

interface Props {
  data: Step1Data
  onNext: (data: Step1Data) => void
  isGuest: boolean
}

export default function Step1Contact({ data, onNext, isGuest }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(schema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-text">Your Contact Details</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue/10 text-blue">
            Step 1 of 5
          </span>
        </div>
        <div className="p-[22px]">
          {isGuest && (
            <div className="mb-4 px-3.5 py-3 bg-grey-50 border border-grey-200 rounded-lg text-[12px] text-grey-500">
              <a href="/login" className="text-blue font-semibold hover:underline">Create an account</a>{' '}
              to save your details for future returns.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                Full Name <span className="text-blue ml-0.5">*</span>
              </label>
              <input
                {...register('full_name')}
                className={inputClass(!!errors.full_name)}
                placeholder="John Smith"
              />
              {errors.full_name && (
                <p className="mt-1 text-[11px] text-red-500">{errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                Company <span className="text-blue ml-0.5">*</span>
              </label>
              <input
                {...register('company')}
                className={inputClass(!!errors.company)}
                placeholder="Your Team / Company"
              />
              {errors.company && (
                <p className="mt-1 text-[11px] text-red-500">{errors.company.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
                Email Address <span className="text-blue ml-0.5">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                className={inputClass(!!errors.email)}
                placeholder="john@yourteam.com"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">Phone</label>
              <input
                {...register('phone')}
                className={inputClass(false)}
                placeholder="+44 7700 900000"
              />
            </div>
          </div>

          <div className="h-px bg-grey-200 my-4" />
          <h3 className="text-[13px] font-semibold text-grey-700 mb-3.5">Return Shipping Address</h3>

          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">
              Street Address <span className="text-blue ml-0.5">*</span>
            </label>
            <input
              {...register('street_address')}
              className={inputClass(!!errors.street_address)}
              placeholder="123 Race Circuit Road"
            />
            {errors.street_address && (
              <p className="mt-1 text-[11px] text-red-500">{errors.street_address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">City</label>
              <input
                {...register('city')}
                className={inputClass(false)}
                placeholder="Northamptonshire"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">Postcode / ZIP</label>
              <input
                {...register('postcode')}
                className={inputClass(false)}
                placeholder="NN12 8TN"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-[13px] font-semibold text-grey-700 mb-1.5">Country</label>
            <select
              {...register('country')}
              className={inputClass(false)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)]"
            >
              Continue to Office &amp; Date
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
