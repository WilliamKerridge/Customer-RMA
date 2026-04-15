import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendRMAIssued } from '@/lib/email'

const UK_ADDRESS = 'Cosworth Electronics Ltd, Brookfield Technology Centre, Twentypence Road, Cottenham, Cambridge, CB24 8PS, United Kingdom'
const US_ADDRESS = 'Cosworth Electronics LLC, 5355 W 86th St, Indianapolis, IN 46268, USA'

async function requireStaff(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null

  // Return the canonical UUID from public.users (not the better-auth TEXT id)
  return { ...session.user, canonicalId: profile.id }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const supabase = createServiceClient()

    // Fetch case + customer email for notification
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number, office, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (caseRow.status !== 'SUBMITTED') {
      return NextResponse.json({ message: 'Case is not in SUBMITTED status' }, { status: 409 })
    }

    // Generate RMA number
    const { data: rmaData, error: rmaError } = await supabase.rpc('generate_rma_number')
    if (rmaError || !rmaData) {
      console.error('RMA generation failed:', rmaError)
      return NextResponse.json({ message: 'Failed to generate RMA number' }, { status: 500 })
    }

    const rmaNumber = rmaData as string
    const officeAddress = caseRow.office === 'UK' ? UK_ADDRESS : US_ADDRESS

    // Update case
    const { error: updateError } = await supabase
      .from('cases')
      .update({ status: 'RMA_ISSUED', rma_number: rmaNumber })
      .eq('id', caseId)

    if (updateError) {
      console.error('Case update failed:', updateError)
      return NextResponse.json({ message: 'Failed to approve case' }, { status: 500 })
    }

    // Create case update
    const { error: auditError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: `Case approved. RMA number ${rmaNumber} issued. Please ship your unit to: ${officeAddress}. Quote your RMA number on the outer packaging.`,
      is_internal: false,
      status_change_to: 'RMA_ISSUED',
    })
    if (auditError) console.error('Audit insert failed on approve:', auditError)

    // Send RMA issued email to customer (non-blocking)
    if (caseRow.customer_id) {
      const { data: customerUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', caseRow.customer_id)
        .single()
      if (customerUser) {
        const cu = customerUser as { email: string; full_name: string | null }

        // Fetch products on this case so the email can list tariff codes
        const { data: caseProducts } = await supabase
          .from('case_products')
          .select('quantity, products(display_name, part_number, tariff_code)')
          .eq('case_id', caseId)

        type ProductJoin = {
          quantity: number
          products: {
            display_name: string
            part_number: string | null
            tariff_code: string | null
          } | null
        }
        const products = ((caseProducts as ProductJoin[] | null) ?? [])
          .filter((cp) => cp.products !== null)
          .map((cp) => ({
            display_name: cp.products!.display_name,
            part_number: cp.products!.part_number,
            quantity: cp.quantity,
            tariff_code: cp.products!.tariff_code,
          }))

        sendRMAIssued(caseId, cu.email, user.email ?? '', {
          customerName: cu.full_name ?? cu.email,
          caseNumber: caseRow.case_number,
          rmaNumber,
          officeAddress,
          products,
        })
      }
    }

    return NextResponse.json({ ok: true, rmaNumber }, { status: 200 })
  } catch (err) {
    console.error('Approve route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
