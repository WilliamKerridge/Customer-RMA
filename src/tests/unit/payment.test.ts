import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mock functions exist when vi.mock factories run
const { stubNotificationMock, supabaseUpdateMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null })
  return {
    stubNotificationMock: vi.fn().mockResolvedValue(null),
    supabaseUpdateMock: vi.fn().mockReturnValue({ eq: eqMock }),
  }
})

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({ update: supabaseUpdateMock }),
  }),
}))

vi.mock('@/lib/email', () => ({
  sendPaymentStubNotification: stubNotificationMock,
}))

import { isPaymentRequired, initiatePayment } from '@/lib/payment'

// ── isPaymentRequired unit tests (pure function) ──────────────────────────────

describe('isPaymentRequired', () => {
  it('returns true when customer account is null (guest submission)', () => {
    expect(isPaymentRequired(null)).toBe(true)
  })

  it('returns true when customer account is undefined', () => {
    expect(isPaymentRequired(undefined)).toBe(true)
  })

  it('returns true when credit_terms is false', () => {
    expect(isPaymentRequired({ credit_terms: false })).toBe(true)
  })

  it('returns false when credit_terms is true', () => {
    expect(isPaymentRequired({ credit_terms: true })).toBe(false)
  })
})

// ── initiatePayment — stub mode ───────────────────────────────────────────────

describe('initiatePayment — stub mode', () => {
  beforeEach(() => {
    process.env.PAYMENT_MODE = 'stub'
    process.env.UK_RETURNS_EMAIL = 'test-returns@cosworth-test.com'
    stubNotificationMock.mockClear()
    supabaseUpdateMock.mockClear()
  })

  it('returns mode: stub when PAYMENT_MODE=stub', async () => {
    const result = await initiatePayment(
      'test-case-id', 700, 'test@example.com', 'CASE-202604-0001', 'Test User'
    )
    expect(result.mode).toBe('stub')
  })

  it('returns a message when in stub mode', async () => {
    const result = await initiatePayment(
      'test-case-id', 700, 'test@example.com', 'CASE-202604-0001', 'Test User'
    )
    if (result.mode === 'stub') {
      expect(result.message).toBeTruthy()
    }
  })

  it('calls sendPaymentStubNotification when PAYMENT_MODE=stub', async () => {
    await initiatePayment('test-case-id', 700, 'test@example.com', 'CASE-202604-0001', 'Test User')
    expect(stubNotificationMock).toHaveBeenCalledOnce()
  })

  it('does not return a clientSecret in stub mode', async () => {
    const result = await initiatePayment(
      'test-case-id', 700, 'test@example.com', 'CASE-202604-0001', 'Test User'
    )
    expect(result).not.toHaveProperty('clientSecret')
  })
})
