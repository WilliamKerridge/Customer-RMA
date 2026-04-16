/**
 * Unit tests for Zod validation schemas used in API routes.
 * These run against the actual schema objects — no mocking.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Reproduce the schemas from the route files ────────────────────────────────
// We define them here rather than importing from route files to keep unit tests
// free of Next.js server-only imports. If a schema changes, update it here too.

const caseUpdateSchema = z.object({
  content: z.string().min(3, 'Update must be at least 3 characters'),
  isInternal: z.boolean().default(false),
  statusChangeTo: z.string().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
})

const holdSchema = z.object({
  holdReason: z.string().min(1, 'Hold reason is required'),
  customerQuestion: z.string().optional(),
})

const productCreateSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  variant: z.string().optional().nullable(),
  display_name: z.string().min(1, 'Display name is required'),
  category: z.string().min(1, 'Category is required'),
  active: z.boolean().default(true),
  test_fee: z.number().min(0).default(0),
  standard_repair_fee: z.number().min(0).default(0),
  major_repair_fee: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  tariff_code: z.string().optional().nullable(),
})

// ── Case update schema ────────────────────────────────────────────────────────

describe('case update schema', () => {
  it('rejects content shorter than 3 characters', () => {
    const result = caseUpdateSchema.safeParse({ content: 'AB', isInternal: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('content')
    }
  })

  it('rejects empty content', () => {
    const result = caseUpdateSchema.safeParse({ content: '', isInternal: false })
    expect(result.success).toBe(false)
  })

  it('accepts valid update with minimum required fields', () => {
    const result = caseUpdateSchema.safeParse({ content: 'Unit received', isInternal: false })
    expect(result.success).toBe(true)
  })

  it('accepts internal update with status change', () => {
    const result = caseUpdateSchema.safeParse({
      content: 'Moving to repair stage',
      isInternal: true,
      statusChangeTo: 'IN_REPAIR',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid product UUID for productId', () => {
    const result = caseUpdateSchema.safeParse({
      content: 'CDU replaced',
      isInternal: false,
      productId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid UUID for productId', () => {
    const result = caseUpdateSchema.safeParse({
      content: 'CDU replaced',
      isInternal: false,
      productId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('defaults isInternal to false when omitted', () => {
    const result = caseUpdateSchema.safeParse({ content: 'Test update' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isInternal).toBe(false)
    }
  })
})

// ── Product schema ────────────────────────────────────────────────────────────

describe('product create schema', () => {
  const validProduct = {
    part_number: '01D-640060',
    display_name: 'CDU 10.3',
    category: 'Engine Management',
    test_fee: 700,
    standard_repair_fee: 1500,
    major_repair_fee: 3500,
  }

  it('accepts a valid product', () => {
    expect(productCreateSchema.safeParse(validProduct).success).toBe(true)
  })

  it('rejects missing part_number', () => {
    const { part_number: _, ...rest } = validProduct
    const result = productCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing display_name', () => {
    const { display_name: _, ...rest } = validProduct
    const result = productCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing category', () => {
    const { category: _, ...rest } = validProduct
    const result = productCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects negative fees', () => {
    const result = productCreateSchema.safeParse({ ...validProduct, test_fee: -100 })
    expect(result.success).toBe(false)
  })

  it('accepts null tariff_code (not all products have one)', () => {
    const result = productCreateSchema.safeParse({ ...validProduct, tariff_code: null })
    expect(result.success).toBe(true)
  })

  it('accepts a tariff code string', () => {
    const result = productCreateSchema.safeParse({ ...validProduct, tariff_code: '8537.10.99' })
    expect(result.success).toBe(true)
  })

  it('defaults active to true when omitted', () => {
    const result = productCreateSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.active).toBe(true)
  })

  it('defaults fees to 0 when omitted', () => {
    const minimal = { part_number: 'TEST-001', display_name: 'Test', category: 'Defence' }
    const result = productCreateSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.test_fee).toBe(0)
      expect(result.data.standard_repair_fee).toBe(0)
      expect(result.data.major_repair_fee).toBe(0)
    }
  })
})

// ── Hold schema ───────────────────────────────────────────────────────────────

describe('hold schema', () => {
  it('rejects empty hold reason', () => {
    const result = holdSchema.safeParse({ holdReason: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid hold reason', () => {
    const result = holdSchema.safeParse({ holdReason: 'AWAITING_PARTS' })
    expect(result.success).toBe(true)
  })

  it('accepts hold with customer question', () => {
    const result = holdSchema.safeParse({
      holdReason: 'AWAITING_CUSTOMER',
      customerQuestion: 'Is the unit still under warranty?',
    })
    expect(result.success).toBe(true)
  })

  it('accepts hold without customer question (question is optional)', () => {
    const result = holdSchema.safeParse({ holdReason: 'AWAITING_PARTS' })
    expect(result.success).toBe(true)
  })
})
