'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signUp } from '@/lib/auth-client'

// ── Schemas ──────────────────────────────────────────────────
const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignInValues = z.infer<typeof signInSchema>
type RegisterValues = z.infer<typeof registerSchema>

// ── Shared field components ───────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-grey-200 bg-grey-100 text-text text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition'

// ── Sign In form ──────────────────────────────────────────────
function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  const onSubmit = async (data: SignInValues) => {
    setServerError(null)
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    })
    if (result.error) {
      setServerError(result.error.message ?? 'Sign in failed. Please try again.')
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Email address" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
          {...register('email')}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClass}
          {...register('password')}
        />
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-blue hover:text-blue-light transition-colors"
        >
          Forgot password?
        </Link>
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
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

// ── Register form ─────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterValues) => {
    setServerError(null)
    const result = await signUp.email({
      email: data.email,
      password: data.password,
      name: `${data.firstName} ${data.lastName}`,
    })
    if (result.error) {
      setServerError(result.error.message ?? 'Registration failed. Please try again.')
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName?.message}>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Will"
            className={inputClass}
            {...register('firstName')}
          />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="Kerridge"
            className={inputClass}
            {...register('lastName')}
          />
        </Field>
      </div>

      <Field label="Company" error={errors.company?.message}>
        <input
          type="text"
          autoComplete="organization"
          placeholder="BT Sport Motorsport"
          className={inputClass}
          {...register('company')}
        />
      </Field>

      <Field label="Email address" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
          {...register('email')}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 characters"
          className={inputClass}
          {...register('password')}
        />
      </Field>

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
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}

// ── Inner page (uses useSearchParams — must be inside Suspense) ─
function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'signin' | 'register'>('signin')

  // Validate next param is a relative path — prevents open redirect attacks
  const raw = searchParams.get('next') ?? ''
  const explicitNext = raw.startsWith('/') && !raw.startsWith('//') ? raw : null

  const handleSuccess = async () => {
    if (explicitNext) {
      router.push(explicitNext)
      router.refresh()
      return
    }

    // Poll /api/me until the Better Auth session cookie has propagated to the
    // server. /api/me returns 401 when no session is found — we retry up to
    // 8 times (≈ 1.6 s total) before falling back to /cases.
    let role = 'customer'
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((r) => setTimeout(r, 200))
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          role = data.role ?? 'customer'
          break // session is ready
        }
        // 401 = session not yet available, keep retrying
      } catch {
        break
      }
    }

    if (role === 'staff_uk' || role === 'staff_us' || role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/cases')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-mid to-[#002040] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-navy px-6 py-8 text-center">
            {/* Logo mark */}
            <div className="w-12 h-12 bg-blue rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="14" height="3" rx="1" fill="white" />
                <rect x="2" y="7.5" width="14" height="3" rx="1" fill="white" opacity="0.8" />
                <rect x="2" y="13" width="14" height="3" rx="1" fill="white" opacity="0.6" />
              </svg>
            </div>
            <h1 className="font-heading font-bold text-xl text-white tracking-wide">
              Cosworth Returns Portal
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Electronics Product Returns &amp; RMA Management
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-grey-200">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'signin'
                  ? 'text-blue border-b-2 border-blue bg-white'
                  : 'text-slate-500 hover:text-text bg-grey-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'register'
                  ? 'text-blue border-b-2 border-blue bg-white'
                  : 'text-slate-500 hover:text-text bg-grey-50'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form area */}
          <div className="px-6 py-6">
            {tab === 'signin' ? (
              <SignInForm onSuccess={handleSuccess} />
            ) : (
              <RegisterForm onSuccess={handleSuccess} />
            )}

            {/* Guest option */}
            <div className="mt-6 pt-5 border-t border-grey-200 text-center">
              <p className="text-xs text-slate-500 mb-2">No account needed?</p>
              <Link
                href="/submit"
                className="text-sm text-blue hover:text-blue-light font-medium transition-colors"
              >
                Continue as guest — Submit a Return Without Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
