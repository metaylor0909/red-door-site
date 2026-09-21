// POST /api/rebuild-webhook — bridges RentEngine's `units`-table webhook
// to a real rebuild+deploy, per CLAUDE.md's locked "wire the webhook
// directly to a rebuild on every INSERT/UPDATE/DELETE — no debounce, no
// queue" decision.
//
// Why this exists instead of a Cloudflare "Deploy Hook": that classic
// POST-able rebuild URL is a Cloudflare Pages-only feature (confirmed
// 2026-09-21 against developers.cloudflare.com). This site deploys as a
// "Worker with static assets" via `wrangler deploy`, which uses a
// different system ("Workers Builds") that's Git-push-triggered only —
// no manual webhook/rebuild-URL of its own. This endpoint is the bridge:
// it turns RentEngine's webhook POST into a `repository_dispatch` call
// against GitHub's API, which the .github/workflows/deploy.yml workflow
// listens for and turns into a real `npm run build && wrangler deploy`.
//
// Auth: a shared secret (REBUILD_WEBHOOK_SECRET). RentEngine's own
// Create Webhook dialog sends its configured "API Key" as an `X-API-Key`
// header (confirmed 2026-09-21, end-to-end against a real deployed
// Worker) — `X-Webhook-Secret` and a `?secret=` query param are also
// accepted, kept from before that was confirmed in case some other
// caller uses one of those instead. Without this check, anyone who
// finds the URL could burn GitHub Actions minutes and Cloudflare
// deploys for free.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const GITHUB_OWNER = 'metaylor0909';
const GITHUB_REPO = 'red-door-site';
const DISPATCH_EVENT_TYPE = 'rentengine-listing-changed';

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request }) => {
  const envRecord = env as unknown as Record<string, unknown>;
  // .trim() guards against a trailing \r or \n silently captured when the
  // value was pasted into an interactive `wrangler secret put` prompt
  // (a common gotcha on Windows terminals) — without it, a correctly
  // pasted value can still fail the comparison below for a reason
  // that's invisible in any log, since the secret's value is never
  // printed anywhere, by design.
  const expectedSecret = typeof envRecord.REBUILD_WEBHOOK_SECRET === 'string' ? envRecord.REBUILD_WEBHOOK_SECRET.trim() : undefined;
  const githubToken = envRecord.GITHUB_PAT;

  if (typeof expectedSecret !== 'string' || expectedSecret.length === 0) {
    console.error('[rebuild-webhook] REBUILD_WEBHOOK_SECRET not configured — refusing all requests.');
    return jsonResponse(503, { error: 'Rebuild webhook is not configured.' });
  }
  if (typeof githubToken !== 'string' || githubToken.length === 0) {
    console.error('[rebuild-webhook] GITHUB_PAT not configured — cannot trigger a rebuild.');
    return jsonResponse(503, { error: 'Rebuild webhook is not configured.' });
  }

  // RentEngine's own webhook config UI sends its configured "API Key" as
  // an `X-API-Key` header (confirmed 2026-09-21, its Create Webhook
  // dialog) — checked alongside the two more generic options this
  // endpoint originally supported, kept in case some other caller (or a
  // future RentEngine UI change) uses one of those instead.
  const url = new URL(request.url);
  const providedSecret =
    request.headers.get('x-api-key') ?? request.headers.get('x-webhook-secret') ?? url.searchParams.get('secret') ?? '';
  if (providedSecret !== expectedSecret) {
    return jsonResponse(401, { error: 'Invalid or missing webhook secret.' });
  }

  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'red-door-site-rebuild-webhook',
    },
    body: JSON.stringify({ event_type: DISPATCH_EVENT_TYPE }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[rebuild-webhook] GitHub dispatch failed: ${response.status} ${detail}`);
    return jsonResponse(502, { error: 'Could not trigger a rebuild.' });
  }

  return jsonResponse(202, { triggered: true });
};
