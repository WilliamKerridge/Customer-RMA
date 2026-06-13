import type { NextConfig } from 'next'
import path from 'path'

// Security headers applied to every response. Stripe needs its JS + frames
// for the Elements payment form; Supabase needs connect-src for storage/db.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js inlines a small runtime script; Stripe.js loads from js.stripe.com
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      // Turbopack CSS @import resolution traverses upward past cosworth-rma/
      // when the parent directory exists without a package.json lockfile.
      // This alias pins tailwindcss to the correct node_modules location.
      tailwindcss: path.resolve(__dirname, 'node_modules', 'tailwindcss'),
    },
  },
}

export default nextConfig
