import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { WorkshopStage, WorkshopStageLabel, WORKSHOP_STAGES } from '@/types/workshop'
import { sendWorkshopStageUpdate } from '@/lib/email'

const bodySchema = z.object({
  stage: z.enum(WORKSHOP_STAGES as [WorkshopStage, ...WorkshopStage[]]),
})

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

  return { ...session.user, canonicalId: profile.id }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { stage } = parsed.data
    const supabase = createServiceClient()

    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number, customer_id, sap_estimated_completion')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    const updates: Record<string, string> = { workshop_stage: stage }
    if (caseRow.status !== 'IN_REPAIR') {
      updates.status = 'IN_REPAIR'
    }

    const { error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)

    if (error) {
      console.error('Stage update failed:', error)
      return NextResponse.json({ message: 'Failed to update stage' }, { status: 500 })
    }

    const stageLabel = WorkshopStageLabel[stage]
    const { error: auditError } = await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: `Workshop stage updated to ${stageLabel}.`,
      is_internal: false,
      status_change_to: caseRow.status !== 'IN_REPAIR' ? 'IN_REPAIR' : null,
    })
    if (auditError) console.error('Audit insert failed on stage update:', auditError)

    // Send workshop stage update email (non-blocking)
    if (caseRow.customer_id) {
      const { data: customerUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', caseRow.customer_id)
        .single()
      if (customerUser) {
        const cu = customerUser as { email: string; full_name: string | null }
        const stageIndex = WORKSHOP_STAGES.indexOf(stage)
        sendWorkshopStageUpdate(caseId, cu.email, {
          customerName: cu.full_name ?? cu.email,
          caseNumber: caseRow.case_number,
          stageName: stageLabel,
          stagesCompleted: stageIndex + 1,
          totalStages: WORKSHOP_STAGES.length,
          estimatedCompletion: caseRow.sap_estimated_completion
            ? new Date(caseRow.sap_estimated_completion).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : null,
        })
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Stage route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
