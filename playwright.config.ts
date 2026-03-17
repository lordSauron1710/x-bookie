import { defineConfig } from '@playwright/test'

const appPort = Number(process.env.E2E_APP_PORT ?? 4173)
const apiPort = Number(process.env.E2E_API_PORT ?? 8787)
const mockXPort = Number(process.env.E2E_MOCK_X_PORT ?? 9191)
const baseUrl = `http://127.0.0.1:${appPort}`
const usePostgres = Boolean(process.env.E2E_DATABASE_URL)
const reuseExistingServer = process.env.E2E_REUSE_SERVER === 'true'

const sharedEnv = {
  ...process.env,
  APP_ORIGIN: baseUrl,
  API_ORIGIN: baseUrl,
  PORT: String(apiPort),
  SESSION_COOKIE_SECRET: 'e2e-session-cookie-secret-1234567890',
  X_CLIENT_ID: 'e2e-client',
  X_CLIENT_SECRET: 'e2e-secret',
  X_REDIRECT_URI: `${baseUrl}/api/auth/x/callback`,
  X_AUTHORIZE_URL: `http://127.0.0.1:${mockXPort}/i/oauth2/authorize`,
  X_API_BASE_URL: `http://127.0.0.1:${mockXPort}/2`,
  VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
  DATABASE_URL: process.env.E2E_DATABASE_URL,
  TOKEN_ENCRYPTION_KEY: process.env.E2E_TOKEN_ENCRYPTION_KEY ?? 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
}

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  reporter: 'list',
  outputDir: 'output/playwright/test-results',
  use: {
    baseURL: baseUrl,
    headless: process.env.E2E_HEADLESS !== 'false',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: usePostgres ? 'postgres' : 'memory' }],
  webServer: [
    {
      command: 'npx tsx e2e/mock-x-server.ts',
      url: `http://127.0.0.1:${mockXPort}/health`,
      env: {
        ...process.env,
        PORT: String(mockXPort),
      },
      reuseExistingServer,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:server',
      url: `http://127.0.0.1:${apiPort}/api/health`,
      env: sharedEnv,
      reuseExistingServer,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npm run dev:client -- --host 127.0.0.1 --port ${appPort}`,
      url: baseUrl,
      env: sharedEnv,
      reuseExistingServer,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
