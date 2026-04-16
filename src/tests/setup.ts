import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Next.js navigation mocks ─────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}))

// ── Environment variables for tests ──────────────────────────────────────────
process.env.PAYMENT_MODE = 'stub'
process.env.BETTER_AUTH_SECRET = 'test_secret_at_least_32_characters_here'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.UK_RETURNS_EMAIL = 'test-returns@cosworth-test.com'
process.env.US_SALES_EMAIL = 'test-us@cosworth-test.com'
