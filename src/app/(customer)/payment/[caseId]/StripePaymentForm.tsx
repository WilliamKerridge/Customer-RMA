'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  caseId: string
  caseNumber: string
  amount: number
  existingIntentId: string | null
}

export default function StripePaymentForm({ caseId, caseNumber, amount, existingIntentId }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/payment/${caseId}/intent`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setError(data.message ?? 'Failed to initialise payment')
      })
      .catch(() => setError('Failed to load payment form'))
  }, [caseId])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] text-red-700">
        {error}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-12 bg-grey-100 rounded-lg" />
        <div className="h-12 bg-grey-100 rounded-lg" />
        <div className="h-10 bg-grey-100 rounded-lg w-1/3" />
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm caseId={caseId} amount={amount} />
    </Elements>
  )
}

function CheckoutForm({ caseId, amount }: { caseId: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/cases/${caseId}?payment=success`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setIsSubmitting(false)
    }
    // On success Stripe redirects to return_url automatically
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
        <PaymentElement />
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full py-3 rounded-xl text-[14px] font-semibold bg-blue text-white hover:bg-blue-light transition-all disabled:opacity-60"
      >
        {isSubmitting ? 'Processing…' : `Pay £${Number(amount).toFixed(2)}`}
      </button>

      <p className="text-center text-[11px] text-grey-400">
        Payments are processed securely by Stripe. Cosworth Electronics never stores your card details.
      </p>
    </form>
  )
}
