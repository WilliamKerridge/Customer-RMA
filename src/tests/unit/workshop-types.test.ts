import { describe, it, expect } from 'vitest'
import {
  WorkshopStage, HoldReason,
  WorkshopStageLabel, HoldCustomerLabel, HoldAdminLabel,
  WORKSHOP_STAGES, HOLD_REASONS,
} from '@/types/workshop'

describe('WorkshopStage enum completeness', () => {
  it('has exactly 7 stages', () => {
    expect(WORKSHOP_STAGES).toHaveLength(7)
  })

  it('every stage has a customer-facing label', () => {
    for (const stage of WORKSHOP_STAGES) {
      expect(
        WorkshopStageLabel[stage],
        `WorkshopStage.${stage} is missing a label`
      ).toBeDefined()
      expect(WorkshopStageLabel[stage].length).toBeGreaterThan(0)
    }
  })

  it('no stage label exposes internal enum names', () => {
    for (const [stage, label] of Object.entries(WorkshopStageLabel)) {
      expect(label, `Label for ${stage} should not be the raw enum value`).not.toBe(stage)
    }
  })
})

describe('HoldReason enum completeness', () => {
  it('has exactly 5 hold reasons', () => {
    expect(HOLD_REASONS).toHaveLength(5)
  })

  it('every hold reason has both a customer and admin label', () => {
    for (const reason of HOLD_REASONS) {
      expect(HoldCustomerLabel[reason], `${reason} missing customer label`).toBeDefined()
      expect(HoldAdminLabel[reason], `${reason} missing admin label`).toBeDefined()
    }
  })
})

describe('workshop stage update route — CASE_STATUSES allowlist', () => {
  // Verify the statuses that are allowed to write to cases.status.
  // This is the guard that prevents workshop-stage / hold values
  // from polluting the case status column.
  const CASE_STATUSES = new Set([
    'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'RMA_ISSUED',
    'PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN',
    'CLOSED', 'REJECTED',
  ])

  it('CREDIT_HELD is not in the case status allowlist', () => {
    expect(CASE_STATUSES.has('CREDIT_HELD')).toBe(false)
  })

  it('workshop stage values are not in the case status allowlist', () => {
    for (const stage of Object.values(WorkshopStage)) {
      expect(
        CASE_STATUSES.has(stage),
        `WorkshopStage.${stage} must not be a valid cases.status value`
      ).toBe(false)
    }
  })

  it('hold reason values are not in the case status allowlist', () => {
    for (const reason of Object.values(HoldReason)) {
      expect(
        CASE_STATUSES.has(reason),
        `HoldReason.${reason} must not be a valid cases.status value`
      ).toBe(false)
    }
  })
})
