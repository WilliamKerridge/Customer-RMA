import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // No baseURL — better-auth infers it from the current window origin.
  // This prevents port mismatch when Next.js picks an alternative port.
})

export const { signIn, signUp, signOut, useSession } = authClient
