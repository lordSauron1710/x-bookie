import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  API_ORIGIN: z.string().url().default('http://localhost:8787'),
  SESSION_COOKIE_SECRET: z.string().min(32).default('dev-session-secret-change-me-immediately'),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  TOKEN_ENCRYPTION_KEY: z.string().trim().min(1).optional(),
  X_CLIENT_ID: z.string().trim().min(1).optional(),
  X_CLIENT_SECRET: z.string().trim().min(1).optional(),
  X_REDIRECT_URI: z.string().url().optional(),
  X_SCOPES: z.string().min(1).default('bookmark.read tweet.read users.read offline.access'),
  X_AUTHORIZE_URL: z.string().url().default('https://x.com/i/oauth2/authorize'),
  X_API_BASE_URL: z.string().url().default('https://api.x.com/2'),
})

const parsed = envSchema.parse(process.env)

if (parsed.NODE_ENV === 'production' && parsed.SESSION_COOKIE_SECRET === 'dev-session-secret-change-me-immediately') {
  throw new Error('SESSION_COOKIE_SECRET must be set in production.')
}

if (parsed.DATABASE_URL && !parsed.TOKEN_ENCRYPTION_KEY) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be set when DATABASE_URL is configured.')
}

export const serverConfig = {
  ...parsed,
  isProduction: parsed.NODE_ENV === 'production',
  xAuthConfigured: Boolean(parsed.X_CLIENT_ID),
  xScopes: parsed.X_SCOPES.split(/\s+/).filter(Boolean),
  xRedirectUri: parsed.X_REDIRECT_URI ?? `${parsed.API_ORIGIN}/api/auth/x/callback`,
}
