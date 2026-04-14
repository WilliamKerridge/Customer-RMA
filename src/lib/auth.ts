import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { Pool } from 'pg'
import { PostgresDialect } from 'kysely'
import { getCorporateDomain } from '@/lib/import/domain-matcher'

// Server-only: pg Pool connecting to Supabase via transaction pooler.
// Never import this file in client components.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET!,

  database: new PostgresDialect({ pool }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true in production
    sendResetPassword: async ({ user, url }) => {
      // Wired up in Phase 7 with Resend
      console.log(`Password reset for ${user.email}: ${url}`)
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh if older than 1 day
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        input: false,
      },
      company: {
        type: 'string',
        required: false,
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const email = user.email.toLowerCase()

            // 1. Upsert into public.users (creates profile or merges with pre-imported record)
            await pool.query(
              `INSERT INTO users (email, full_name, company, phone, role)
               VALUES ($1, $2, $3, $4, 'customer')
               ON CONFLICT (email) DO UPDATE
                 SET full_name  = COALESCE(EXCLUDED.full_name,  users.full_name),
                     company    = COALESCE(EXCLUDED.company,    users.company),
                     phone      = COALESCE(EXCLUDED.phone,      users.phone),
                     updated_at = now()`,
              [email, (user as { name?: string }).name ?? null, (user as { company?: string }).company ?? null, (user as { phone?: string }).phone ?? null]
            )

            // 2. Look up the public.users id we just created/updated
            const { rows: profileRows } = await pool.query<{ id: string }>(
              `SELECT id FROM users WHERE email = $1 LIMIT 1`,
              [email]
            )
            const profileId = profileRows[0]?.id
            if (!profileId) return

            // 3. Check if a customer_account already exists for this profile
            const { rows: existingAcc } = await pool.query<{ id: string }>(
              `SELECT id FROM customer_accounts WHERE user_id = $1 LIMIT 1`,
              [profileId]
            )
            if (existingAcc.length > 0) return // account already set up (pre-imported), nothing to do

            // 4. Try domain matching — copy credit_terms / po_required from another account
            //    at the same corporate domain (ignores free email providers)
            const domain = getCorporateDomain(email)
            let creditTerms = false
            let poRequired  = false
            let companyName: string | null = null

            if (domain) {
              const { rows: domainMatch } = await pool.query<{
                credit_terms: boolean
                po_required:  boolean
                company_name: string | null
              }>(
                `SELECT ca.credit_terms, ca.po_required, ca.company_name
                 FROM customer_accounts ca
                 JOIN users u ON u.id = ca.user_id
                 WHERE u.email ILIKE $1
                   AND ca.account_active = true
                 ORDER BY ca.created_at ASC
                 LIMIT 1`,
                [`%@${domain}`]
              )

              if (domainMatch.length > 0) {
                creditTerms = domainMatch[0].credit_terms
                poRequired  = domainMatch[0].po_required
                companyName = domainMatch[0].company_name
              }
            }

            // 5. Create the customer_account for this new user
            await pool.query(
              `INSERT INTO customer_accounts (user_id, company_name, credit_terms, po_required, account_active)
               VALUES ($1, $2, $3, $4, true)
               ON CONFLICT DO NOTHING`,
              [profileId, companyName, creditTerms, poRequired]
            )
          } catch (err) {
            // Never block registration — log and continue
            console.error('post-registration account hook failed:', err)
          }
        },
      },
    },
  },

  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
