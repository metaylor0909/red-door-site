// GET /rental-analysis/{token}/pdf — the report as a downloadable PDF.
//
// Cloudflare Browser Rendering (the BROWSER binding, wrangler.toml) opens
// the report's print layout (/rental-analysis/{token}?print=1, which never
// counts as an owner visit) and saves it as a Letter-size PDF. Reports are
// frozen snapshots, so the result is cached for a day and repeat downloads
// skip the render. Same 6-month link expiry as the report page itself.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const REPORT_LINK_DAYS = 183;
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BrowserBinding {
  quickAction(action: 'pdf', options: Record<string, unknown>): Promise<Response>;
}

function fileNameFor(address: string): string {
  const safe = address.replace(/[^A-Za-z0-9 .,#-]/g, '').replace(/\s+/g, ' ').trim();
  return `Rental Analysis - ${safe || 'Red Door'}.pdf`;
}

export const GET: APIRoute = async ({ params, url, redirect }) => {
  const token = params.token ?? '';
  if (!TOKEN_PATTERN.test(token)) return new Response('Not found', { status: 404 });

  const row = await env.DB.prepare('SELECT created_at, property_address FROM rental_analyses WHERE token = ?')
    .bind(token)
    .first<{ created_at: string; property_address: string }>();
  if (!row) return new Response('Not found', { status: 404 });
  if (Date.now() - Date.parse(row.created_at) > REPORT_LINK_DAYS * 86_400_000) {
    return redirect('/rental-analysis/expired', 302);
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const browser = (env as unknown as { BROWSER?: BrowserBinding }).BROWSER;
  if (!browser) {
    console.error('[rental-analysis/pdf] BROWSER binding is not configured.');
    return new Response('PDF download is temporarily unavailable.', { status: 503 });
  }

  let rendered: Response;
  try {
    rendered = await browser.quickAction('pdf', {
      url: `${url.origin}/rental-analysis/${token}?print=1`,
      gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
      // Keep PDF renders out of Google Analytics.
      rejectRequestPattern: ['/googletagmanager\\.com/', '/google-analytics\\.com/', '/analytics\\.google\\.com/'],
      viewport: { width: 1100, height: 1400 },
      pdfOptions: {
        format: 'letter',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.65in', left: '0.5in' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate:
          '<div style="width:100%;font-size:8px;color:#717073;text-align:center;font-family:Arial,sans-serif;">' +
          'Red Door Property Management &middot; 317.660.1626 &middot; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      },
    });
  } catch (err) {
    console.error('[rental-analysis/pdf] Render failed:', err);
    return new Response('We could not create the PDF right now. Please try again in a moment.', { status: 502 });
  }
  if (!rendered.ok) {
    console.error(`[rental-analysis/pdf] Render returned ${rendered.status}: ${await rendered.text().catch(() => '')}`);
    return new Response('We could not create the PDF right now. Please try again in a moment.', { status: 502 });
  }

  const response = new Response(await rendered.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileNameFor(row.property_address)}"`,
      'Cache-Control': 'private, max-age=86400',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
  // The Cache API needs a shared-cacheable copy; the user still gets the
  // private response above.
  const toCache = new Response(response.clone().body, response);
  toCache.headers.set('Cache-Control', 'public, max-age=86400');
  await cache.put(cacheKey, toCache);
  return response;
};
