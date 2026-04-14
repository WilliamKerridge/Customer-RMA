/**
 * Creates better-auth tables in Supabase using getAuthTables.
 * Usage: node scripts/migrate-auth.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
for (const line of env.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
}

import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// better-auth's core table schema for email/password + additional user fields
const SQL = `
CREATE TABLE IF NOT EXISTS "user" (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  "emailVerified"   BOOLEAN NOT NULL DEFAULT false,
  image             TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  role              TEXT DEFAULT 'customer',
  company           TEXT,
  phone             TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
  id            TEXT PRIMARY KEY,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id                        TEXT PRIMARY KEY,
  "accountId"               TEXT NOT NULL,
  "providerId"              TEXT NOT NULL,
  "userId"                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"             TEXT,
  "refreshToken"            TEXT,
  "idToken"                 TEXT,
  "accessTokenExpiresAt"    TIMESTAMPTZ,
  "refreshTokenExpiresAt"   TIMESTAMPTZ,
  scope                     TEXT,
  password                  TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id            TEXT PRIMARY KEY,
  identifier    TEXT NOT NULL,
  value         TEXT NOT NULL,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ,
  "updatedAt"   TIMESTAMPTZ
);
`

const client = await pool.connect()
try {
  console.log('Running better-auth table migrations...')
  await client.query(SQL)
  console.log('✓ Tables created (or already exist):')
  console.log('  user, session, account, verification')
} catch (err) {
  console.error('✗ Migration failed:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
