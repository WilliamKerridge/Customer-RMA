import { WorkshopStage, HoldReason } from '@/types/workshop'

export interface MappedStatus {
  workshop_stage: WorkshopStage | null
  hold_reason: HoldReason | null
  /** true = clear any active hold; false = leave hold state as-is */
  clear_hold: boolean
}

/**
 * Maps a Power BI "Product Status" (Planner bucket) value to portal enums.
 * Comparison is case-insensitive and trims whitespace.
 * Returns null if the bucket is unrecognised.
 */
export function mapPlannerBucket(rawStatus: string): MappedStatus | null {
  const s = rawStatus.trim().toLowerCase()

  // ── Workshop stages ────────────────────────────────────────────────────────
  if (s === 'awaiting test')    return { workshop_stage: WorkshopStage.AWAITING_TEST,    hold_reason: null, clear_hold: true }
  if (s === 're-test' || s === 'retest') return { workshop_stage: WorkshopStage.RETEST, hold_reason: null, clear_hold: true }
  if (s === 'rework')           return { workshop_stage: WorkshopStage.REWORK,           hold_reason: null, clear_hold: true }
  if (s === 'final test')       return { workshop_stage: WorkshopStage.FINAL_TEST,       hold_reason: null, clear_hold: true }
  if (s === 'clean and label')  return { workshop_stage: WorkshopStage.CLEAN_AND_LABEL,  hold_reason: null, clear_hold: true }
  if (s === 'inspection')       return { workshop_stage: WorkshopStage.INSPECTION,       hold_reason: null, clear_hold: true }
  if (s === 'completed')        return { workshop_stage: WorkshopStage.WORKSHOP_COMPLETE, hold_reason: null, clear_hold: true }

  // ── Hold states ────────────────────────────────────────────────────────────
  if (s === 'awaiting parts')   return { workshop_stage: null, hold_reason: HoldReason.AWAITING_PARTS,    clear_hold: false }
  if (s === 'with support')     return { workshop_stage: null, hold_reason: HoldReason.WITH_SUPPORT,      clear_hold: false }
  if (s === 'with engineering') return { workshop_stage: null, hold_reason: HoldReason.WITH_ENGINEERING,  clear_hold: false }
  if (s === 'awaiting confirmation customer' || s === 'awaiting customer confirmation') {
    return { workshop_stage: null, hold_reason: HoldReason.AWAITING_CUSTOMER, clear_hold: false }
  }
  if (s === 'credit held')      return { workshop_stage: null, hold_reason: HoldReason.CREDIT_HELD,       clear_hold: false }

  return null
}

/** Human-readable label for display in the import preview */
export function describeMappedStatus(mapped: MappedStatus): string {
  if (mapped.hold_reason) {
    const labels: Record<HoldReason, string> = {
      [HoldReason.AWAITING_PARTS]:    'Hold: Awaiting Parts',
      [HoldReason.WITH_SUPPORT]:      'Hold: With Support',
      [HoldReason.WITH_ENGINEERING]:  'Hold: With Engineering',
      [HoldReason.AWAITING_CUSTOMER]: 'Hold: Awaiting Customer',
      [HoldReason.CREDIT_HELD]:       'Hold: Credit Held',
    }
    return labels[mapped.hold_reason]
  }
  if (mapped.workshop_stage) {
    const labels: Record<WorkshopStage, string> = {
      [WorkshopStage.AWAITING_TEST]:     'Awaiting Test',
      [WorkshopStage.RETEST]:            'Under Test',
      [WorkshopStage.REWORK]:            'In Rework',
      [WorkshopStage.FINAL_TEST]:        'Final Test',
      [WorkshopStage.CLEAN_AND_LABEL]:   'Finishing',
      [WorkshopStage.INSPECTION]:        'Inspection',
      [WorkshopStage.WORKSHOP_COMPLETE]: 'Repair Complete',
    }
    return labels[mapped.workshop_stage]
  }
  return '—'
}
