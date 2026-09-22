// POST /api/contact/submit — the real contact.astro form's submission
// handler. Reuses the rental-analysis tool's Turnstile verification and
// Resend client (both fully generic, nothing rental-analysis-specific in
// their logic) rather than duplicating them.
//
// Unlike rental-analysis, there's no per-submission "product" page to fall
// back to if email delivery fails, so the submission is stored in D1
// first (contact_submissions — db/migrations/0002_contact_submissions.sql)
// before attempting to send anything. A Resend failure is logged but does
// not fail the request — the lead is never silently lost either way.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyTurnstileToken } from '../../../lib/rental-analysis/turnstile';
import { sendEmail } from '../../../lib/rental-analysis/resend-client';
import { buildContactNotificationEmail } from '../../../lib/contact/emails';

export const prerender = false;

function jsonError(status: number, message: string, fieldErrors?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message, fieldErrors }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function readBodyAsRecord(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v ?? '')]));
  }
  const form = await request.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
}

export const POST: APIRoute = async ({ request }) => {
  const envRecord = env as unknown as Record<string, unknown>;

  let raw: Record<string, string>;
  try {
    raw = await readBodyAsRecord(request);
  } catch {
    return jsonError(400, 'Could not read the submitted form data.');
  }

  // Spam check — same graceful-degrade-with-a-loud-warning pattern as
  // rental-analysis: don't block all local development just because
  // TURNSTILE_SECRET_KEY isn't set, but never ship without it.
  const turnstileSecret = envRecord.TURNSTILE_SECRET_KEY;
  if (typeof turnstileSecret === 'string' && turnstileSecret.length > 0) {
    // Turnstile auto-injects its solved token into the widget's own
    // hidden `cf-turnstile-response` input once the form's `<div
    // class="cf-turnstile">` is solved — that's the real field name to
    // read, not a custom one. (A previous version of this form tried to
    // copy the token into a separate `turnstile_token` field via a
    // `data-callback` JS function that was never actually defined
    // anywhere, so that field stayed permanently empty and every real
    // submission failed this check once TURNSTILE_SECRET_KEY was set —
    // found and fixed 2026-09-22.)
    const token = raw['cf-turnstile-response'];
    const passed = token ? await verifyTurnstileToken(token, turnstileSecret) : false;
    if (!passed) return jsonError(400, 'Spam check failed. Please try again.');
  } else {
    console.warn('[contact/submit] TURNSTILE_SECRET_KEY not configured — spam check skipped.');
  }

  const fieldErrors: Record<string, string> = {};
  const name = raw.name?.trim() ?? '';
  const email = raw.email?.trim() ?? '';
  const inquiryType = raw.inquiry_type?.trim() ?? '';
  const referralSource = raw.referral_source?.trim() ?? '';
  const phone = raw.phone?.trim() ?? '';
  const comment = raw.comment?.trim() ?? '';
  const smsConsent = raw.sms_consent === 'on' || raw.sms_consent === 'true';

  if (!name) fieldErrors.name = 'Please enter your name.';
  if (!email || !email.includes('@')) fieldErrors.email = 'Please enter a valid email address.';
  if (!inquiryType) fieldErrors.inquiry_type = 'Please select an inquiry type.';
  if (!referralSource) fieldErrors.referral_source = 'Please let us know how you heard about us.';
  if (Object.keys(fieldErrors).length > 0) {
    return jsonError(422, 'Please fix the highlighted fields.', fieldErrors);
  }

  const db = env.DB;
  if (!db) {
    console.error('[contact/submit] D1 binding "DB" is not configured.');
    return jsonError(500, 'The contact form is temporarily unavailable. Please call us instead.');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO contact_submissions (
          id, created_at, name, email, phone, inquiry_type, referral_source, comment, sms_consent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, now, name, email, phone || null, inquiryType, referralSource, comment || null, smsConsent ? 1 : 0)
      .run();
  } catch (err) {
    console.error('[contact/submit] Failed to store submission:', err);
    return jsonError(500, 'The contact form is temporarily unavailable. Please call us instead.');
  }

  const resendKey = envRecord.RESEND_API_KEY;
  if (typeof resendKey === 'string' && resendKey.length > 0) {
    try {
      await sendEmail(
        buildContactNotificationEmail({ name, email, phone, inquiryType, referralSource, comment, smsConsent }),
        resendKey
      );
    } catch (err) {
      console.error('[contact/submit] Notification email failed to send:', err);
    }
  } else {
    console.warn('[contact/submit] RESEND_API_KEY not configured — notification email skipped.');
  }

  return new Response(JSON.stringify({ ok: true, redirectUrl: '/contact-thank-you' }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
