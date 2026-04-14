/**
 * Generic/free email provider domains that should never be used
 * for company account matching.
 */
const GENERIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'hotmail.it',
  'outlook.com', 'outlook.co.uk',
  'live.com', 'live.co.uk',
  'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.es',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me',
  'tutanota.com',
  'zohomail.com',
  'yandex.com', 'yandex.ru',
  'mail.com',
  'gmx.com', 'gmx.co.uk',
  'btinternet.com', 'btopenworld.com',
  'virginmedia.com',
  'sky.com', 'talktalk.net',
  'ntlworld.com',
])

/**
 * Extracts the domain from an email address and returns null
 * if it is a generic/free provider (not suitable for account matching).
 */
export function getCorporateDomain(email: string): string | null {
  const parts = email.toLowerCase().split('@')
  if (parts.length !== 2) return null
  const domain = parts[1].trim()
  if (!domain || GENERIC_DOMAINS.has(domain)) return null
  return domain
}

export function isGenericDomain(email: string): boolean {
  return getCorporateDomain(email) === null
}
