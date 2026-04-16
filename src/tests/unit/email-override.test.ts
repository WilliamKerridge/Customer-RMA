/**
 * Unit tests for the TEST_EMAIL_OVERRIDE mechanism in src/lib/email.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.hoisted ensures these are available when vi.mock factories run (they get hoisted too)
const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ data: { id: 'msg-test' }, error: null }),
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: sendMock } },
  FROM_EMAIL: 'noreply@cosworth.com',
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: () => ({
        then: (fn: (v: { error: null }) => void) => fn({ error: null }),
      }),
    }),
  }),
}))

import { sendCaseSubmitted } from '@/lib/email'

const TEST_PROPS = {
  customerName: 'Test Customer',
  caseNumber: 'CASE-202604-0001',
  products: [{ display_name: 'CDU 10.3', quantity: 1 }],
  officeLabel: 'UK',
  requiredDate: null,
}

beforeEach(() => {
  sendMock.mockClear()
})

afterEach(() => {
  delete process.env.TEST_EMAIL_OVERRIDE
})

describe('TEST_EMAIL_OVERRIDE', () => {
  it('sends to the real recipient when override is not set', async () => {
    delete process.env.TEST_EMAIL_OVERRIDE

    await sendCaseSubmitted('case-id', 'customer@example.com', TEST_PROPS)

    expect(sendMock).toHaveBeenCalledOnce()
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.to).toBe('customer@example.com')
    expect(callArgs.subject).not.toContain('[→')
  })

  it('redirects to override address when TEST_EMAIL_OVERRIDE is set', async () => {
    process.env.TEST_EMAIL_OVERRIDE = 'william.kerridge@cosworth.com'

    await sendCaseSubmitted('case-id', 'customer@example.com', TEST_PROPS)

    expect(sendMock).toHaveBeenCalledOnce()
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.to).toBe('william.kerridge@cosworth.com')
    expect(callArgs.subject).toContain('[→ customer@example.com]')
  })

  it('prefixes the intended recipient in the subject when overriding', async () => {
    process.env.TEST_EMAIL_OVERRIDE = 'william.kerridge@cosworth.com'

    await sendCaseSubmitted('case-id', 'someone@motorsport.com', TEST_PROPS)

    const subject = sendMock.mock.calls[0][0].subject as string
    expect(subject).toMatch(/^\[→ someone@motorsport\.com\]/)
  })
})
