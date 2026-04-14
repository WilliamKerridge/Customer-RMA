'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    const result = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reset-password`,
    })
    if (result.error) {
      setServerError(result.error.message ?? 'Something went wrong. Please try again.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-mid to-[#002040] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-navy px-6 py-6 text-center">
            <h1 className="font-heading font-bold text-lg text-white">Reset Password</h1>
            <p className="text-sm text-slate-300 mt-1">Cosworth Returns Portal</p>
          </div>

          <div className="px-6 py-6">
            {sent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text mb-1">Check your inbox</p>
                <p className="text-xs text-slate-500">
                  If that email is registered, you&apos;ll receive a reset link shortly.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block text-sm text-blue hover:text-blue-light transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                <p className="text-sm text-slate-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-grey-200 bg-grey-100 text-text text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue hover:bg-blue-light disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                >
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>

                <Link
                  href="/login"
                  className="text-center text-sm text-blue hover:text-blue-light transition-colors"
                >
                  Back to sign in
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
