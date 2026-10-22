// Cloudflare Turnstile server-side verification. Per CLAUDE.md, Turnstile
// on this form is not optional — it's a metered API cost behind a new
// public entry point (RentEngine $0.50/call, RentCast, Mapbox), an
// obvious spam/abuse target.

export async function verifyTurnstileToken(token: string, secretKey: string, remoteIp?: string): Promise<boolean> {
  const body = new URLSearchParams();
  body.set('secret', secretKey);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    console.warn(`[turnstile] siteverify request failed: HTTP ${response.status}`);
    return false;
  }
  const result = (await response.json()) as { success: boolean; 'error-codes'?: string[]; hostname?: string };
  // Cloudflare's reason (e.g. timeout-or-duplicate, invalid-input-secret),
  // so a rejected real submission can be diagnosed from the Worker logs.
  if (result.success !== true) {
    console.warn(`[turnstile] siteverify rejected: ${(result['error-codes'] ?? []).join(', ') || 'no error code'} (hostname: ${result.hostname ?? 'n/a'})`);
  }
  return result.success === true;
}
