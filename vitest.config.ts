import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 55,
        lines: 70,
      },
      exclude: [
        'dist/**',
        'node_modules/**',
        'src/main.tsx',
        'src/**/*.test.{ts,tsx}',
        'server/**/*.test.{ts,tsx}',
      ],
    },
  },
})
