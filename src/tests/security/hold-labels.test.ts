/**
 * SECURITY TESTS — IMMUTABLE
 *
 * These tests enforce a critical data-protection rule: the internal
 * hold reason CREDIT_HELD must NEVER be exposed in any customer-facing
 * response, label, or email. Customers must only see the generic message
 * "On Hold — Please Contact Us".
 *
 * If any of these tests fail, there is a real security/data-protection
 * issue. Fix the application code — never modify these tests.
 */

import { describe, it, expect } from 'vitest'
import { HoldReason, HoldCustomerLabel, HoldAdminLabel } from '@/types/workshop'

describe('CREDIT_HELD must never be exposed to customers', () => {
  it('CREDIT_HELD maps to a safe customer label', () => {
    expect(HoldCustomerLabel[HoldReason.CREDIT_HELD]).toBeDefined()
    expect(HoldCustomerLabel[HoldReason.CREDIT_HELD]).toBe('On Hold — Please Contact Us')
  })

  it('CREDIT_HELD customer label does not contain the word "credit"', () => {
    const label = HoldCustomerLabel[HoldReason.CREDIT_HELD].toLowerCase()
    expect(label).not.toContain('credit')
  })

  it('CREDIT_HELD customer label does not contain the word "held"', () => {
    const label = HoldCustomerLabel[HoldReason.CREDIT_HELD].toLowerCase()
    expect(label).not.toContain('held')
  })

  it('CREDIT_HELD customer label does not contain financial terminology', () => {
    const label = HoldCustomerLabel[HoldReason.CREDIT_HELD].toLowerCase()
    const forbidden = ['invoice', 'payment', 'debt', 'overdue', 'account', 'finance', 'billing']
    for (const word of forbidden) {
      expect(label, `Customer label must not contain "${word}"`).not.toContain(word)
    }
  })
})

describe('all hold reasons have customer labels', () => {
  it('every HoldReason has a defined customer label', () => {
    for (const reason of Object.values(HoldReason)) {
      expect(
        HoldCustomerLabel[reason],
        `HoldReason.${reason} is missing a customer label`
      ).toBeDefined()
      expect(HoldCustomerLabel[reason].length).toBeGreaterThan(0)
    }
  })

  it('no customer label exposes internal system terminology', () => {
    const internalTerms = ['CREDIT_HELD', 'AWAITING_PARTS', 'WITH_SUPPORT',
                           'WITH_ENGINEERING', 'AWAITING_CUSTOMER']
    for (const [reason, label] of Object.entries(HoldCustomerLabel)) {
      for (const term of internalTerms) {
        expect(
          label,
          `Customer label for ${reason} must not contain internal term "${term}"`
        ).not.toContain(term)
      }
    }
  })
})

describe('CREDIT_HELD is only in admin labels', () => {
  it('CREDIT_HELD appears in admin label (staff can see it)', () => {
    expect(HoldAdminLabel[HoldReason.CREDIT_HELD]).toBeDefined()
    expect(HoldAdminLabel[HoldReason.CREDIT_HELD].toLowerCase()).toContain('credit')
  })

  it('customer label for CREDIT_HELD is different from admin label', () => {
    expect(HoldCustomerLabel[HoldReason.CREDIT_HELD]).not.toBe(
      HoldAdminLabel[HoldReason.CREDIT_HELD]
    )
  })
})
