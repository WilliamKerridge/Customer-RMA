import { describe, it, expect } from 'vitest'
import { mapPlannerBucket } from '@/lib/import/stage-mapper'
import { WorkshopStage, HoldReason } from '@/types/workshop'

describe('mapPlannerBucket — workshop stage mappings', () => {
  it('maps "Awaiting test" to AWAITING_TEST', () => {
    const result = mapPlannerBucket('Awaiting test')
    expect(result?.workshop_stage).toBe(WorkshopStage.AWAITING_TEST)
    expect(result?.hold_reason).toBeNull()
  })

  it('maps "Re-test" to RETEST', () => {
    expect(mapPlannerBucket('Re-test')?.workshop_stage).toBe(WorkshopStage.RETEST)
  })

  it('maps "Retest" (no hyphen) to RETEST', () => {
    expect(mapPlannerBucket('Retest')?.workshop_stage).toBe(WorkshopStage.RETEST)
  })

  it('maps "Rework" to REWORK', () => {
    expect(mapPlannerBucket('Rework')?.workshop_stage).toBe(WorkshopStage.REWORK)
  })

  it('maps "Final test" to FINAL_TEST', () => {
    expect(mapPlannerBucket('Final test')?.workshop_stage).toBe(WorkshopStage.FINAL_TEST)
  })

  it('maps "Clean and label" to CLEAN_AND_LABEL', () => {
    expect(mapPlannerBucket('Clean and label')?.workshop_stage).toBe(WorkshopStage.CLEAN_AND_LABEL)
  })

  it('maps "Inspection" to INSPECTION', () => {
    expect(mapPlannerBucket('Inspection')?.workshop_stage).toBe(WorkshopStage.INSPECTION)
  })

  it('maps "Completed" to WORKSHOP_COMPLETE', () => {
    expect(mapPlannerBucket('Completed')?.workshop_stage).toBe(WorkshopStage.WORKSHOP_COMPLETE)
  })

  it('sets clear_hold=true for all workshop stage mappings', () => {
    const stages = ['Awaiting test', 'Re-test', 'Rework', 'Final test',
                    'Clean and label', 'Inspection', 'Completed']
    for (const stage of stages) {
      expect(mapPlannerBucket(stage)?.clear_hold, `${stage} should clear hold`).toBe(true)
    }
  })
})

describe('mapPlannerBucket — hold state mappings', () => {
  it('maps "Awaiting parts" to AWAITING_PARTS hold', () => {
    const result = mapPlannerBucket('Awaiting parts')
    expect(result?.hold_reason).toBe(HoldReason.AWAITING_PARTS)
    expect(result?.workshop_stage).toBeNull()
  })

  it('maps "With support" to WITH_SUPPORT hold', () => {
    expect(mapPlannerBucket('With support')?.hold_reason).toBe(HoldReason.WITH_SUPPORT)
  })

  it('maps "With engineering" to WITH_ENGINEERING hold', () => {
    expect(mapPlannerBucket('With engineering')?.hold_reason).toBe(HoldReason.WITH_ENGINEERING)
  })

  it('maps "Awaiting confirmation customer" to AWAITING_CUSTOMER hold', () => {
    expect(mapPlannerBucket('Awaiting confirmation customer')?.hold_reason)
      .toBe(HoldReason.AWAITING_CUSTOMER)
  })

  it('maps "Awaiting customer confirmation" (reversed) to AWAITING_CUSTOMER hold', () => {
    expect(mapPlannerBucket('Awaiting customer confirmation')?.hold_reason)
      .toBe(HoldReason.AWAITING_CUSTOMER)
  })

  it('maps "Credit held" to CREDIT_HELD hold', () => {
    expect(mapPlannerBucket('Credit held')?.hold_reason).toBe(HoldReason.CREDIT_HELD)
  })

  it('sets clear_hold=false for all hold state mappings', () => {
    const holds = ['Awaiting parts', 'With support', 'With engineering',
                   'Awaiting confirmation customer', 'Credit held']
    for (const hold of holds) {
      expect(mapPlannerBucket(hold)?.clear_hold, `${hold} should not clear hold`).toBe(false)
    }
  })
})

describe('mapPlannerBucket — case insensitivity', () => {
  it('is case-insensitive for workshop stages', () => {
    expect(mapPlannerBucket('AWAITING TEST')?.workshop_stage).toBe(WorkshopStage.AWAITING_TEST)
    expect(mapPlannerBucket('completed')?.workshop_stage).toBe(WorkshopStage.WORKSHOP_COMPLETE)
    expect(mapPlannerBucket('REWORK')?.workshop_stage).toBe(WorkshopStage.REWORK)
  })

  it('is case-insensitive for hold states', () => {
    expect(mapPlannerBucket('CREDIT HELD')?.hold_reason).toBe(HoldReason.CREDIT_HELD)
    expect(mapPlannerBucket('WITH SUPPORT')?.hold_reason).toBe(HoldReason.WITH_SUPPORT)
  })

  it('trims leading and trailing whitespace', () => {
    expect(mapPlannerBucket('  Rework  ')?.workshop_stage).toBe(WorkshopStage.REWORK)
  })
})

describe('mapPlannerBucket — unknown values', () => {
  it('returns null for unrecognised bucket names', () => {
    expect(mapPlannerBucket('Unknown Stage')).toBeNull()
    expect(mapPlannerBucket('')).toBeNull()
    expect(mapPlannerBucket('Pending')).toBeNull()
  })

  it('CREDIT_HELD is never returned as a workshop_stage', () => {
    // Credit held is a hold reason only — it must never set a workshop stage
    const result = mapPlannerBucket('Credit held')
    expect(result?.workshop_stage).toBeNull()
    expect(result?.hold_reason).toBe(HoldReason.CREDIT_HELD)
  })
})
