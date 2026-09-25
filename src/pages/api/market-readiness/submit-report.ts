// POST /api/market-readiness/submit-report -- the Market Readiness self-
// check's "Email My Full Report" handler. Reuses the rental-analysis
// tool's Turnstile verification and Resend client, same as
// contact/submit.ts, rather than duplicating them.
//
// The score/report is RECOMPUTED here from the raw answers via
// scoring.ts, not trusted from the client's own JSON -- the client sends
// answers (source data) plus, separately, the report it rendered for
// itself; the server only uses its own recomputed version for the
// stored record and the emails, so a tampered request can't claim a
// fake score. See src/lib/market-readiness/scoring.ts's header comment.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyTurnstileToken } from '../../../lib/rental-analysis/turnstile';
import { sendEmail } from '../../../lib/rental-analysis/resend-client';
import { buildOwnerReportEmail, buildLeadSimpleEmail } from '../../../lib/market-readiness/emails';
import { buildFullReport, isComplete, type Answers } from '../../../lib/market-readiness/scoring';
import { READINESS_QUESTIONS } from '../../../lib/market-readiness/questions';

export const prerender = false;

function jsonError(status: number, message: string, fieldErrors?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message, fieldErrors }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface RequestBody {
  email?: string;
  first_name?: string;
  property_address?: string;
  phone?: string;
  answers?: Record<string, string>;
  'cf-turnstile-response'?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const envRecord = env as unknown as Record<string, unknown>;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, 'Could not read the submitted data.');
  }

  const turnstileSecret = envRecord.TURNSTILE_SECRET_KEY;
  if (typeof turnstileSecret === 'string' && turnstileSecret.length > 0) {
    const token = body['cf-turnstile-response'];
    const passed = token ? await verifyTurnstileToken(token, turnstileSecret) : false;
    if (!passed) return jsonError(400, 'Spam check failed. Please try again.');
  } else {
    console.warn('[market-readiness/submit-report] TURNSTILE_SECRET_KEY not configured -- spam check skipped.');
  }

  const email = body.email?.trim() ?? '';
  const firstName = body.first_name?.trim() || undefined;
  const propertyAddress = body.property_address?.trim() || undefined;
  const phone = body.phone?.trim() || undefined;

  const fieldErrors: Record<string, string> = {};
  if (!email || !email.includes('@')) fieldErrors.email = 'Please enter a valid email address.';

  const rawAnswers = body.answers || {};
  const answers: Answers = {};
  for (const question of READINESS_QUESTIONS) {
    const value = rawAnswers[question.id];
    if (value === 'yes' || value === 'no' || value === 'unsure') {
      answers[question.id] = value;
    }
  }
  if (!isComplete(answers)) {
    fieldErrors.answers = 'All 24 questions must be answered before a report can be generated.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return jsonError(422, 'Please fix the highlighted fields.', fieldErrors);
  }

  const report = buildFullReport(answers);
  const dateGenerated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const db = env.DB;
  if (!db) {
    console.error('[market-readiness/submit-report] D1 binding "DB" is not configured.');
    return jsonError(500, "We couldn't send your report yet. Your answers have been preserved. Please try again.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO market_readiness_submissions (
          id, created_at, email, first_name, property_address, phone,
          score, result_category_key, result_category_heading, answers_json, report_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        now,
        email,
        firstName || null,
        propertyAddress || null,
        phone || null,
        report.score,
        report.category.key,
        report.category.heading,
        JSON.stringify(answers),
        JSON.stringify(report)
      )
      .run();
  } catch (err) {
    console.error('[market-readiness/submit-report] Failed to store submission:', err);
    return jsonError(500, "We couldn't send your report yet. Your answers have been preserved. Please try again.");
  }

  const resendKey = envRecord.RESEND_API_KEY;
  if (typeof resendKey !== 'string' || resendKey.length === 0) {
    console.warn('[market-readiness/submit-report] RESEND_API_KEY not configured -- report email skipped.');
    // The submission is safely stored either way, but per the "never show
    // a fake success message" requirement, a request that can't actually
    // deliver anything is a real failure, not a soft success.
    return jsonError(502, "We couldn't send your report yet. Your answers have been preserved. Please check your email address and try again.");
  }

  try {
    await sendEmail(
      buildOwnerReportEmail({ ownerEmail: email, firstName, propertyAddress, report, dateGenerated }),
      resendKey
    );
  } catch (err) {
    console.error('[market-readiness/submit-report] Report email failed to send:', err);
    return jsonError(502, "We couldn't send your report yet. Your answers have been preserved. Please check your email address and try again.");
  }

  try {
    await sendEmail(buildLeadSimpleEmail({ email, firstName, propertyAddress, phone, report }), resendKey);
  } catch (err) {
    // The owner's report already sent successfully -- a LeadSimple hiccup
    // shouldn't turn that into a failure response, same "never lose a
    // lead silently, but don't block on a secondary system" reasoning as
    // rental-analysis's own submit.ts.
    console.error('[market-readiness/submit-report] LeadSimple lead email failed to send:', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
