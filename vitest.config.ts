import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/tests/unit/**/*.test.ts', 'src/tests/unit/**/*.test.tsx',
              'src/tests/integration/**/*.test.ts'],
    exclude: ['src/tests/e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      exclude: ['node_modules/**', '.next/**', 'src/tests/**', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
