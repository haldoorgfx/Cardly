import dns from 'dns';

// ── SSRF guard for outbound webhooks ─────────────────────────────────────────
// A logged-in user controls the webhook URL. Without this, they could point it
// at internal hosts or the cloud metadata endpoint (169.254.169.254) and the
// server would happily POST to it. We require HTTPS and reject any URL whose
// hostname resolves to a private / loopback / link-local address.
//
// Re-validate at fire time (not just registration) so a DNS-rebind — register a
// public IP, then re-point it at 127.0.0.1 — can't slip past the check.

/** Parse an IPv4 dotted string to a 32-bit unsigned int, or null if malformed. */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    acc = acc * 256 + n;
  }
  return acc >>> 0;
}

/** True if an IPv4 address falls in a private / loopback / link-local / reserved range. */
function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // unparseable → treat as unsafe
  const inRange = (base: string, maskBits: number) => {
    const baseInt = ipv4ToInt(base)!;
    const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
    return (n & mask) === (baseInt & mask);
  };
  return (
    inRange('0.0.0.0', 8) ||        // "this" network
    inRange('10.0.0.0', 8) ||       // RFC1918
    inRange('100.64.0.0', 10) ||    // CGNAT
    inRange('127.0.0.0', 8) ||      // loopback
    inRange('169.254.0.0', 16) ||   // link-local (incl. cloud metadata)
    inRange('172.16.0.0', 12) ||    // RFC1918
    inRange('192.0.0.0', 24) ||     // IETF protocol assignments
    inRange('192.168.0.0', 16) ||   // RFC1918
    inRange('198.18.0.0', 15) ||    // benchmarking
    inRange('224.0.0.0', 4) ||      // multicast
    inRange('240.0.0.0', 4)         // reserved
  );
}

/** True if an IPv6 address is loopback / unspecified / unique-local / link-local. */
function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().split('%')[0]; // strip zone id

  // IPv4-mapped (::ffff:1.2.3.4) and IPv4-compatible — check the embedded v4.
  const mapped = addr.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  if (addr === '::1' || addr === '::') return true;       // loopback / unspecified
  if (addr.startsWith('fe80') || addr.startsWith('fe9') ||
      addr.startsWith('fea')  || addr.startsWith('feb')) return true; // fe80::/10 link-local
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true;    // fc00::/7 unique-local
  return false;
}

function isPrivateAddress(ip: string, family: number): boolean {
  return family === 6 ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

export type WebhookUrlCheck = { ok: true } | { ok: false; reason: string };

/**
 * Validate that a webhook URL is HTTPS and does not resolve to a private,
 * loopback, or link-local address. Performs a DNS lookup of the hostname.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<WebhookUrlCheck> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Invalid URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Webhook URL must use HTTPS.' };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  // If the host is already a literal IP, check it directly (no DNS needed).
  const literalV4 = ipv4ToInt(host);
  if (literalV4 !== null) {
    return isPrivateIPv4(host)
      ? { ok: false, reason: 'Webhook URL resolves to a private address.' }
      : { ok: true };
  }
  if (host.includes(':')) {
    return isPrivateIPv6(host)
      ? { ok: false, reason: 'Webhook URL resolves to a private address.' }
      : { ok: true };
  }

  // Hostname → resolve every address and reject if ANY is private.
  let addrs: dns.LookupAddress[];
  try {
    addrs = await dns.promises.lookup(host, { all: true });
  } catch {
    return { ok: false, reason: 'Webhook host could not be resolved.' };
  }
  if (addrs.length === 0) {
    return { ok: false, reason: 'Webhook host did not resolve to any address.' };
  }
  for (const { address, family } of addrs) {
    if (isPrivateAddress(address, family)) {
      return { ok: false, reason: 'Webhook URL resolves to a private address.' };
    }
  }
  return { ok: true };
}
