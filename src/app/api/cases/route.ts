import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendCaseSubmitted } from '@/lib/email'
import { initiatePayment, isPaymentRequired } from '@/lib/payment'

const productSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().min(1, 'Product is required'),
  serial_number: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  fault_notes: z.string().optional(),
})

const submissionSchema = z.object({
  contact: z.object({
    full_name: z.string().min(1, 'Full name is required'),
    company: z.string().min(1, 'Company is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    street_address: z.string().min(1, 'Street address is required'),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  }),
  office: z.enum(['UK', 'US']),
  required_return_date: z.string().min(1, 'Return date is required'),
  po_number: z.string().optional(),
  products: z.array(productSchema).min(1, 'At least one product is required'),
  fault_type: z.enum(['repair', 'service', 'service_plan', 'loan_return', 'code_update']),
  fault_display_info: z.boolean().default(false),
  fault_display_details: z.string().optional(),
  tested_other_unit: z.boolean().default(false),
  fault_follows: z.enum(['unit', 'car']).optional(),
  fault_description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = submissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Get current authenticated user (guest submissions are allowed)
    const session = await auth.api.getSession({ headers: await headers() })

    const supabase = createServiceClient()

    // Resolve canonical public.users UUID by email.
    // better-auth session.user.id is the Better Auth internal ID — it does NOT
    // match public.users.id (which is a Postgres UUID). Email is the shared key.
    let userId: string | null = null
    if (session?.user?.email) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single()
      userId = (profile as { id: string } | null)?.id ?? null
    }

    // Generate case number via DB function
    const { data: caseNumber, error: caseNumberError } = await supabase.rpc('generate_case_number')
    if (caseNumberError || !caseNumber) {
      console.error('generate_case_number failed:', caseNumberError)
      return NextResponse.json({ message: 'Failed to generate case number' }, { status: 500 })
    }

    // Determine payment requirements
    let customerAccount: { credit_terms: boolean } | null = null
    if (userId) {
      const { data } = await supabase
        .from('customer_accounts')
        .select('credit_terms')
        .eq('user_id', userId)
        .single()
      customerAccount = data as { credit_terms: boolean } | null
    }

    const paymentRequired = isPaymentRequired(customerAccount)
    const paymentStatus: 'pending' | 'stub_notified' | 'waived' = paymentRequired
      ? (process.env.PAYMENT_MODE === 'stripe' ? 'pending' : 'stub_notified')
      : 'waived'

    // Insert case
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        case_number: caseNumber,
        customer_id: userId,
        office: data.office,
        status: 'SUBMITTED',
        fault_type: data.fault_type,
        fault_description: data.fault_description ?? null,
        fault_display_info: data.fault_display_info,
        fault_display_details: data.fault_display_details ?? null,
        tested_on_other_unit: data.tested_other_unit,
        fault_follows: data.fault_follows ?? null,
        required_return_date: data.required_return_date,
        shipping_address: {
          name: data.contact.full_name,
          company: data.contact.company,
          email: data.contact.email,
          phone: data.contact.phone ?? '',
          street: data.contact.street_address,
          city: data.contact.city ?? '',
          postcode: data.contact.postcode ?? '',
          country: data.contact.country ?? 'GB',
        },
        po_number: data.po_number ?? null,
        payment_required: paymentRequired,
        payment_status: paymentStatus,
      })
      .select('id, case_number')
      .single()

    if (caseError || !newCase) {
      console.error('Case insert failed:', caseError)
      return NextResponse.json({ message: 'Failed to create case' }, { status: 500 })
    }

    // Insert case_products
    const caseProducts = data.products.map((p) => ({
      case_id: newCase.id,
      product_id: p.product_id,
      serial_number: p.serial_number ?? null,
      quantity: p.quantity,
      fault_notes: p.fault_notes ?? null,
    }))

    const { error: productsError } = await supabase.from('case_products').insert(caseProducts)

    if (productsError) {
      // Case was created — log but don't fail the request
      console.error('case_products insert failed:', productsError)
    }

    // Initiate payment if required (non-blocking for stub mode)
    if (paymentRequired) {
      const testFee = 0 // real fee set by staff on review; 0 at submission
      initiatePayment(
        newCase.id,
        testFee,
        data.contact.email,
        newCase.case_number,
        data.contact.full_name,
      ).catch((err) => console.error('initiatePayment failed:', err))
    }

    // Send submission confirmation email (non-blocking)
    const customerEmail = data.contact.email
    const customerName = data.contact.full_name
    const officeLabel = data.office === 'UK' ? 'Cosworth Electronics UK' : 'Cosworth Electronics USA'

    // Fetch product names for the email
    const { data: caseProductRows } = await supabase
      .from('case_products')
      .select('quantity, products ( display_name, part_number )')
      .eq('case_id', newCase.id)

    const emailProducts = (caseProductRows ?? []).map((cp) => {
      const p = cp.products as { display_name: string; part_number: string } | null
      return {
        display_name: p?.display_name ?? 'Unknown product',
        part_number: p?.part_number,
        quantity: cp.quantity,
      }
    })

    sendCaseSubmitted(newCase.id, customerEmail, {
      customerName,
      caseNumber: newCase.case_number,
      products: emailProducts,
      officeLabel,
      requiredDate: data.required_return_date ?? null,
    })

    return NextResponse.json(
      {
        case_id: newCase.id,
        case_number: newCase.case_number,
        payment_required: paymentRequired,
        payment_url: paymentRequired ? `/payment/${newCase.id}` : null,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Case submission error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
