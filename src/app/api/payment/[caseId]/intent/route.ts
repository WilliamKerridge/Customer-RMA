import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

    const { caseId } = await params
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, case_number, stripe_payment_intent_id, customer_id, payment_status')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    // Verify ownership
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()
    const userId = (userProfile as { id: string } | null)?.id
    if (userId && caseRow.customer_id && caseRow.customer_id !== userId) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ message: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const amount = 0 // fee confirmed post-review

    // Re-use existing intent if already created
    if (caseRow.stripe_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(caseRow.stripe_payment_intent_id)
      if (existing.status !== 'succeeded' && existing.status !== 'canceled') {
        return NextResponse.json({ clientSecret: existing.client_secret })
      }
    }

    // Create new PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount > 0 ? amount : 100, // minimum 1p for demo
      currency: 'gbp',
      metadata: { caseId, caseNumber: caseRow.case_number },
      receipt_email: session.user.email,
    })

    await supabase
      .from('cases')
      .update({ stripe_payment_intent_id: paymentIntent.id, payment_status: 'pending' })
      .eq('id', caseId)

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('PaymentIntent error:', err)
    return NextResponse.json({ message: 'Failed to create payment intent' }, { status: 500 })
  }
}
