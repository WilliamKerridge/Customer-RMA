import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe env vars not configured')
    return NextResponse.json({ message: 'Not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const caseId = intent.metadata?.caseId

    if (caseId) {
      // Update payment status to 'paid'
      const { data: caseRow } = await supabase
        .from('cases')
        .select('id, status, case_number, customer_id')
        .eq('id', caseId)
        .single()

      if (caseRow) {
        const updates: Record<string, string> = { payment_status: 'paid' }

        // Advance status from AWAITING_PAYMENT to UNDER_REVIEW
        if (caseRow.status === 'AWAITING_PAYMENT') {
          updates.status = 'UNDER_REVIEW'
        }

        const { error } = await supabase
          .from('cases')
          .update(updates)
          .eq('id', caseId)

        if (error) {
          console.error('Webhook: case update failed:', error)
        } else {
          // Create a case update record
          await supabase.from('case_updates').insert({
            case_id: caseId,
            author_id: null,
            content: 'Payment received. Case is now under review.',
            is_internal: false,
            status_change_to: caseRow.status === 'AWAITING_PAYMENT' ? 'UNDER_REVIEW' : null,
          })
        }
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const caseId = intent.metadata?.caseId
    console.error(`Payment failed for case ${caseId}: ${intent.last_payment_error?.message}`)
    // Keep status as AWAITING_PAYMENT — customer can retry via the payment page
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
