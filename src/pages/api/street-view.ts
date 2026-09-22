// GET /api/street-view?lat=&lng= — proxies a Google Street View Static
// API image for the rental-analysis report page's subject property.
// The API key stays server-side only; the report page's <img> just
// points here, never carries the key itself.
//
// Checks the (free, unbilled) metadata endpoint first so a location
// with no Street View coverage returns a clean 404 instead of Google's
// generic "no imagery available" gray placeholder photo — the report
// page hides the <img> entirely on error (see [token].astro) rather
// than show that.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const IMAGE_SIZE = '640x400';

export const GET: APIRoute = async ({ url }) => {
  const envRecord = env as unknown as Record<string, unknown>;
  const apiKey = envRecord.GOOGLE_STREETVIEW_API_KEY;
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    return new Response('Street View not configured', { status: 503 });
  }

  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  if (!lat || !lng) {
    return new Response('Missing lat/lng', { status: 400 });
  }
  const location = `${lat},${lng}`;

  try {
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(location)}&key=${apiKey}`;
    const metadataResponse = await fetch(metadataUrl);
    const metadata = (await metadataResponse.json()) as { status: string };
    if (metadata.status !== 'OK') {
      return new Response('No Street View coverage for this location', { status: 404 });
    }

    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=${IMAGE_SIZE}&location=${encodeURIComponent(location)}&fov=80&key=${apiKey}`;
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response('Street View image request failed', { status: 502 });
    }

    // Street View imagery for a fixed lat/lng rarely changes — cache
    // aggressively so repeat report-page views don't re-bill Google.
    return new Response(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    });
  } catch (err) {
    console.error('[street-view] Failed:', err);
    return new Response('Street View request failed', { status: 502 });
  }
};
