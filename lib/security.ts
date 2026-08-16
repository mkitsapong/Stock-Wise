/**
 * Cybersecurity & Input Validation Helpers
 * Provides protection against SSRF, Injection, XSS, and parameter abuse.
 */

// Whitelist of allowed external domains for news fetching & scraping (Anti-SSRF)
const ALLOWED_NEWS_DOMAINS = [
  'finance.yahoo.com',
  'yahoo.com',
  'bloomberg.com',
  'reuters.com',
  'cnbc.com',
  'wsj.com',
  'marketwatch.com',
  'investing.com',
  'fool.com',
  'benzinga.com',
  'seekingalpha.com',
  'thestreet.com',
  'barrons.com',
  'ft.com',
  'forbes.com',
];

/**
 * Validates external URLs against SSRF (Server-Side Request Forgery) attacks.
 * Blocks private IP ranges, non-HTTPS protocols, localhost, and untrusted domains.
 */
export function isValidNewsUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);

    // 1. Enforce HTTPS only
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Block Localhost and Loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // 3. Block Private/Internal IPv4 addresses
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const first = parseInt(ipMatch[1], 10);
      const second = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (first === 10) return false;
      // 172.16.0.0/12
      if (first === 172 && second >= 16 && second <= 31) return false;
      // 192.168.0.0/16
      if (first === 192 && second === 168) return false;
      // 169.254.0.0/16 (Link-local / Cloud Metadata)
      if (first === 169 && second === 254) return false;
      // 127.0.0.0/8
      if (first === 127) return false;
    }

    // 4. Check domain whitelist (or subdomains of whitelist)
    const isAllowedDomain = ALLOWED_NEWS_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    return isAllowedDomain;
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes financial asset symbols.
 * Only allows alphanumeric characters, dots, hyphens, and carets (max 15 chars).
 */
export function sanitizeSymbol(rawSymbol: string): string | null {
  if (!rawSymbol || typeof rawSymbol !== 'string') return null;
  const trimmed = rawSymbol.trim().toUpperCase();
  const symbolRegex = /^[A-Z0-9.\-^=]{1,15}$/;
  if (!symbolRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Validates an array of symbols and enforces max batch size.
 */
export function sanitizeSymbols(rawSymbols: string[], maxBatch = 50): string[] {
  if (!Array.isArray(rawSymbols)) return [];
  const validSymbols: string[] = [];

  for (const s of rawSymbols) {
    const clean = sanitizeSymbol(s);
    if (clean && !validSymbols.includes(clean)) {
      validSymbols.push(clean);
    }
    if (validSymbols.length >= maxBatch) break;
  }

  return validSymbols;
}
