import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactCompiler: true,
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
