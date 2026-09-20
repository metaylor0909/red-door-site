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

  if (!response.ok) return false;
  const result = (await response.json()) as { success: boolean };
  return result.success === true;
}
