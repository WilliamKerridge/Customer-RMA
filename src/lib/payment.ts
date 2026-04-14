import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPaymentStubNotification } from '@/lib/email'

// ── Stripe client (only initialised when needed) ─────────────────────────────
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ── isPaymentRequired ────────────────────────────────────────────────────────

export function isPaymentRequired(
  customerAccount: { credit_terms: boolean } | null | undefined
): boolean {
  // Guest (no account) or no credit terms → payment required
  return !customerAccount?.credit_terms
}

// ── initiatePayment ──────────────────────────────────────────────────────────

type StubResult = { mode: 'stub'; message: string }
type StripeResult = { mode: 'stripe'; clientSecret: string }
type PaymentResult = StubResult | StripeResult

export async function initiatePayment(
  caseId: string,
  amount: number,
  customerEmail: string,
  caseNumber: string,
  customerName: string,
): Promise<PaymentResult> {
  const supabase = createServiceClient()
  const mode = process.env.PAYMENT_MODE ?? 'stub'

  if (mode === 'stripe') {
    const stripe = getStripe()

    // Create a PaymentIntent in pence
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      metadata: { caseId, caseNumber, customerEmail },
      receipt_email: customerEmail,
    })

    // Store the intent ID and update status
    await supabase
      .from('cases')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
      })
      .eq('id', caseId)

    return { mode: 'stripe', clientSecret: paymentIntent.client_secret! }
  }

  // ── Stub mode ────────────────────────────────────────────────────────────
  await supabase
    .from('cases')
    .update({ payment_status: 'stub_notified' })
    .eq('id', caseId)

  const contactEmail =
    process.env.UK_RETURNS_EMAIL ?? 'returns@cosworth.com'

  sendPaymentStubNotification(caseId, customerEmail, {
    customerName,
    caseNumber,
    inspectionFee: amount,
    contactEmail,
  })

  return { mode: 'stub', message: 'Payment notification sent' }
}
